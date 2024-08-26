import type { LandscapeCluster, ServiceTreeService } from '../../lib/service-tree-def.ts';
import { $ } from 'bun';
import type { TaskRunner } from '../../tasks/tasks.ts';
import type { KubectlUtil } from '../../lib/utility/kubectl-util.ts';

class GenericGracefulAdminClusterDestructor {
  constructor(
    private task: TaskRunner,
    private k: KubectlUtil,
    private sulfoxideHelium: ServiceTreeService,
    private sulfoxideBoron: ServiceTreeService,
    private sulfoxideTofu: ServiceTreeService,
  ) {}

  async Run([adminLandscape, adminCluster]: LandscapeCluster): Promise<void> {
    const admin = { landscape: adminLandscape, cluster: adminCluster };

    // common variables
    const helium = this.sulfoxideHelium;
    const boron = this.sulfoxideBoron;
    const tofu = this.sulfoxideTofu;

    const context = `${admin.landscape.slug}-${admin.cluster.principal.slug}`;

    const tofuDir = `./platforms/${tofu.platform.slug}/${tofu.principal.slug}`;

    const heliumNS = `${helium.platform.slug}-${helium.principal.slug}`;
    const boronNS = `${boron.platform.slug}-${boron.principal.slug}`;
    const fluorineNS = `velero`;
    const mainNS = helium.platform.slug;

    // Delete all validating webhooks
    await this.task.Run([
      'Delete Validating Webhooks',
      async () => {
        await $`kubectl --context ${context} delete validatingwebhookconfigurations --all`.nothrow();
      },
    ]);

    // Delete all namespaces
    await this.task.Run([
      'Delete Namespaces',
      async () => {
        for (const namespace of [heliumNS, boronNS, fluorineNS, mainNS]) {
          console.log(`  🗑️ Removing namespace: ${namespace}`);
          await this.k.DeleteNamespace({
            context,
            namespace,
          });
          console.log(`  ✅ Namespace removed: ${namespace}`);
        }
      },
    ]);

    // setup tofu repository correctly
    await this.task.Run([
      'Setup Tofu',
      async () => {
        await $`pls setup`.cwd(tofuDir);
      },
    ]);

    // destroy generic infrastructure
    const L1G = `${admin.landscape.slug}:l1:${admin.cluster.set.slug}`;
    await this.task.Run([
      'Destroy Generic Infrastructure',
      async () => {
        await $`pls ${{ raw: L1G }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L1G }}:destroy`.cwd(tofuDir);
      },
    ]);

    // destroy L1 infrastructure
    const L1 = `${admin.landscape.slug}:l1:${admin.cluster.principal.slug}`;
    await this.task.Run([
      'Destroy L1 Infrastructure',
      async () => {
        await $`pls ${{ raw: L1 }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L1 }}:state:rm -- 'kubernetes_namespace.sulfoxide'`.cwd(tofuDir).nothrow();
        await $`pls ${{ raw: L1 }}:destroy`.cwd(tofuDir);
      },
    ]);

    // destroy L0 infrastructure
    const L0 = `${admin.landscape.slug}:l0:${admin.cluster.principal.slug}`;
    await this.task.Run([
      'Destroy L0 Infrastructure',
      async () => {
        await $`pls ${{ raw: L0 }}:destroy`.cwd(tofuDir);
      },
    ]);

    // update kubectl configurations
    await this.task.Run([
      'Retrieve Kubectl Configurations',
      async () => {
        await $`pls kubectl`;
      },
    ]);
  }
}

export { GenericGracefulAdminClusterDestructor };
