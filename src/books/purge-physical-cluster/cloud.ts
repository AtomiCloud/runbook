import type {
  LandscapeCluster,
  ServiceTreeLandscapePrincipal,
  ServiceTreeService,
} from '../../lib/service-tree-def.ts';
import { $ } from 'bun';
import postgres from 'postgres';
import type { TaskRunner } from '../../tasks/tasks.ts';
import { KubectlUtil, type Resource, type ResourceSearch } from '../../lib/utility/kubectl-util.ts';
import type { YamlManipulator } from '../../lib/utility/yaml-manipulator.ts';
import path from 'node:path';
import type { UtilPrompter } from '../../lib/prompts/util-prompter.ts';

class GenericPhysicalClusterCloudPurger {
  constructor(
    private task: TaskRunner,
    private y: YamlManipulator,
    private k: KubectlUtil,
    private up: UtilPrompter,
    private projectId: string,
    private env: string,
    private tofuKey: string,
    private kubernetesAccess: ServiceTreeService,
    private sulfoxideHelium: ServiceTreeService,
    private virtualLandscapes: ServiceTreeLandscapePrincipal[],
  ) {}

  async Run(
    [phyLandscape, phyCluster]: LandscapeCluster,
    [adminLandscape, adminCluster]: LandscapeCluster,
  ): Promise<void> {
    const Ka = this.kubernetesAccess;
    const He = this.sulfoxideHelium;

    const pl = phyLandscape.slug;
    const pc = phyCluster.principal.slug;
    const al = adminLandscape.slug;
    const ac = adminCluster.principal.slug;
    const aCtx = `${al}-${ac}`;
    const aNS = `${He.platform.slug}-${He.principal.slug}`;

    const KaPID = Ka.principal.projectId;
    const KaKey = `${pc.toUpperCase()}_KUBECONFIG`;

    const HePID = He.principal.projectId;
    const HeKey = `${pl.toUpperCase()}_${pc.toUpperCase()}_KUBECONFIG`;
    const HeDir = `./platforms/${He.platform.slug}/${He.principal.slug}`;
    const HePath = path.join(HeDir, 'chart', `values.${al}.yaml`);

    // setup tofu repository correctly
    const rootFlags = `--projectId=${this.projectId} --env=${this.env} ${this.tofuKey}`;
    const secret = await $`infisical secrets get --plain ${{ raw: rootFlags }}`.text();

    // setup connection to tofu
    const sql = postgres(secret);

    await this.task.Run([
      'Check database reachability',
      async () => {
        try {
          await sql`SELECT 1`;
        } catch (e) {
          console.log('❌ Database not reachable');
          await sql.end();
          throw e;
        }
      },
    ]);

    await this.task.Run([
      'Deleting L0 States',
      async () => {
        const table = `${pl}-l0-${pc}`;
        try {
          await sql`DELETE FROM ${sql(table)}.states`;
        } catch (e) {
          await sql.end();
          throw e;
        }
      },
    ]);

    await this.task.Run([
      'Deleting L1 States',
      async () => {
        const table = `${pl}-l1-${pc}`;
        try {
          await sql`DELETE FROM ${sql(table)}.states`;
        } catch (e) {
          await sql.end();
          throw e;
        }
      },
    ]);

    await sql.end();

    await this.task.Run([
      `Deleting Kubernetes Access for ${pl} ${pc}`,
      async () => {
        const kaFlag = `--projectId=${KaPID} --env=${pl} --type=shared ${KaKey}`;
        console.log('⛳ Flags: ', kaFlag);
        await $`infisical secrets delete ${{ raw: kaFlag }}`;
      },
    ]);

    await this.task.Run([
      `Deleting Sulfoxide Helium for ${pl} ${pc} on ${al} ${ac}`,
      async () => {
        const heFlag = `--projectId=${HePID} --env=${al} --type=shared ${HeKey}`;
        console.log('⛳ Flags: ', heFlag);
        await $`infisical secrets delete ${{ raw: heFlag }}`;
      },
    ]);

    // Clean up admin cluster
    // Update ArgoCD configurations
    await this.task.Run([
      'Update Helium Configuration',
      async () => {
        console.log(`🗑️ Removing ArgoCD configurations. Path: ${HePath}`);
        await this.y.Mutate(HePath, [
          [['connector', 'clusters', pl, pc, 'enable'], false],
          [['connector', 'clusters', pl, pc, 'deployAppSet'], false],
          [['connector', 'clusters', pl, pc, 'aoa', 'enable'], false],
          [['connector', 'clusters', pl, pc, 'destination'], ''],
        ]);
      },
    ]);

    // Apply ArgoCD configurations
    const adminPls = `${al}:${adminCluster.set.slug}`;
    await this.task.Run([
      'Apply Helium Configuration',
      async () => {
        await $`pls ${{ raw: adminPls }}:install -- --kube-context ${aCtx} --namespace ${aNS}`.cwd(HeDir);
      },
    ]);

    // delete applications from ArgoCD
    const appsToRemove: ResourceSearch = {
      kind: 'app',
      context: aCtx,
      namespace: aNS,
      selector: [['atomi.cloud/cluster', pc]],
    };

    const deleteApps = async () => {
      console.log(`🗑️ Delete Root Application: ${pl}-${pc}-carbon`);
      await this.k.Delete({
        kind: 'app',
        context: aCtx,
        namespace: aNS,
        name: `${pl}-${pc}-carbon`,
      });
      console.log('✅ Root Application deleted');

      console.log('🗑️ Deleting applications...');
      await this.k.DeleteRange(appsToRemove);
      console.log('✅ Applications deleted');
    };

    await this.task.Run(['Delete Applications', deleteApps]);

    await this.task.Run([
      'Wait for Applications to be deleted',
      async () => {
        return await this.k.Wait(0, 3, appsToRemove, {
          count: 3,
          action: async () => {
            const deleteApp = await this.up.YesNo('Do you want to manually delete the applications?');
            if (deleteApp) await deleteApps();
            return false;
          },
        });
      },
    ]);

    // update kubectl configurations
    await this.task.Run([
      'Retrieve Kubectl Configurations',
      async () => {
        await $`pls kubectl`;
      },
    ]);

    const vSlugs = this.virtualLandscapes.map(x => x.slug);

    await this.task.Run([
      'Delete ExternalSecret in admin',
      async () => {
        const allES: Resource[] = await this.k.GetRange({
          kind: 'externalsecret',
          context: aCtx,
          namespace: aNS,
        });

        const toBeDeleted = allES.filter(x => {
          vSlugs.some(s => x.name.includes(`${s}-${pc}-cluster-secret`)) ||
            x.name.includes(`${pl}-${pc}-external-secret`) ||
            x.name.includes(`${pl}-${pc}-external-secret-bearer-token`) ||
            x.name.includes(`${pl}-${pc}-external-secret-ca-crt`);
        });

        console.log(
          '🗑️ Deleting ExternalSecrets...',
          toBeDeleted.map(x => x.name),
        );
        for (const d of toBeDeleted) {
          await this.k.Delete(d);
        }
      },
    ]);

    // delete pointers to old cluster in admin
    await this.task.Run([
      'Delete SecretStore in admin',
      async () => {
        const allSS: Resource[] = await this.k.GetRange({
          kind: 'secretstore',
          context: aCtx,
          namespace: aNS,
        });

        const toBeDeleted = allSS.filter(x => vSlugs.some(s => x.name.includes(`${s}-${pc}`)));

        console.log(
          '🗑️ Deleting ExternalSecrets...',
          toBeDeleted.map(x => x.name),
        );
        for (const d of toBeDeleted) {
          await this.k.Delete(d);
        }
      },
    ]);
  }
}

export { GenericPhysicalClusterCloudPurger };
