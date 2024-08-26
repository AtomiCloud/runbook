import type { LandscapeCluster, ServiceTreeService } from '../../lib/service-tree-def.ts';
import type { TaskRunner } from '../../tasks/tasks.ts';
import type { KubectlUtil, Resource } from '../../lib/utility/kubectl-util.ts';
import { $ } from 'bun';
import type { SulfoxideHeliumWaiter } from '../../tasks/sulfoxide-helium-waiter.ts';
import type { SulfoxideBoronWaiter } from '../../tasks/sulfoxide-boron-waiter.ts';

class AdminClusterTransitioner {
  constructor(
    private t: TaskRunner,
    private k: KubectlUtil,
    private sulfoxideHelium: ServiceTreeService,
    private sulfoxideFluorine: ServiceTreeService,
    private sulfoxideBoron: ServiceTreeService,
    private sulfoxideHeliumWaiter: SulfoxideHeliumWaiter,
    private sulfoxideBoronWaiter: SulfoxideBoronWaiter,
  ) {}

  async Run([fL, fC]: LandscapeCluster, [tL, tC]: LandscapeCluster): Promise<void> {
    // common variables

    // services
    const He = this.sulfoxideHelium;
    const F = this.sulfoxideFluorine;
    const B = this.sulfoxideBoron;

    // contexts
    const fCtx = `${fL.slug}-${fC.principal.slug}`;
    const tCtx = `${tL.slug}-${tC.principal.slug}`;

    // namespaces
    const He_NS = `${He.platform.slug}-${He.principal.slug}`;
    const B_NS = `${B.platform.slug}-${B.principal.slug}`;

    // dir
    const F_Dir = `./platforms/${F.platform.slug}/${F.principal.slug}`;

    console.log('🎯 Both systems are operational, performing transition...');
    const prefix = `${He_NS}-argocd`;
    const resources: Resource[] = [
      ...[
        `${prefix}-applicationset-controller`,
        `${prefix}-notifications-controller`,
        `${prefix}-redis`,
        `${prefix}-server`,
        `${prefix}-repo-server`,
      ].map(name => ({
        kind: 'deployment',
        context: fCtx,
        namespace: He_NS,
        name,
      })),
      {
        kind: 'statefulset',
        context: fCtx,
        namespace: He_NS,
        name: `${prefix}-application-controller`,
      },
    ];
    const replicas: Record<string, number> = {};

    await this.t.Run([
      'Get Replicas',
      async () => {
        for (const resource of resources) replicas[resource.name] = await this.k.GetReplica(resource);
      },
    ]);

    console.log('🔀 Replicas before scaling down:', replicas);

    await this.t.Run([
      'Scale Down Old Cluster',
      async () => {
        for (const resource of resources) await this.k.Scale(resource, 0);
      },
    ]);

    // perform migration via velero
    await this.t.Run([
      'Velero Migration',
      async () => {
        await $`nix develop -c pls migrate -- ${fCtx} ${tCtx}`.cwd(F_Dir);
      },
    ]);

    await this.t.Exec([
      'Wait for Helium to be migrated',
      async () => {
        await this.k.Wait(5, 5, {
          kind: 'deployment',
          context: tCtx,
          namespace: He_NS,
          selector: [['app.kubernetes.io/part-of', `argocd`]],
        });
        await this.k.Wait(1, 5, {
          kind: 'statefulset',
          context: tCtx,
          namespace: He_NS,
          selector: [['app.kubernetes.io/part-of', `argocd`]],
        });
      },
    ]);

    await this.t.Exec([
      'Wait for Boron to be migrated',
      async () => {
        await this.k.Wait(1, 5, {
          kind: 'deployment',
          context: tCtx,
          namespace: B_NS,
          fieldSelector: [['metadata.name', `${B.platform.slug}-${B.principal.slug}`]],
        });
      },
    ]);

    // Scale back up the new cluster
    await this.t.Run([
      'Scale Up New Cluster',
      async () => {
        for (const resource of resources) {
          resource.context = tCtx;
          await this.k.Scale(resource, replicas[resource.name]);
        }
      },
    ]);

    // wait for new cluster to be ready
    const waitForHelium = this.sulfoxideHeliumWaiter.task(tCtx, He_NS);
    await this.t.Exec(waitForHelium);

    const waitForBoron = this.sulfoxideBoronWaiter.task(tCtx, B_NS);
    await this.t.Run(waitForBoron);

    console.log('🎉 Transition completed!');
  }
}

export { AdminClusterTransitioner };
