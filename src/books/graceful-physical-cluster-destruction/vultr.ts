import type {
  LandscapeCluster,
  ServiceTreeLandscapePrincipal,
  ServiceTreeService,
} from '../../lib/service-tree-def.ts';
import path from 'node:path';
import { $ } from 'bun';
import { KubectlUtil, type ResourceSearch } from '../../lib/utility/kubectl-util.ts';
import type { TaskRunner } from '../../tasks/tasks.ts';
import type { YamlManipulator } from '../../lib/utility/yaml-manipulator.ts';
import type { UtilPrompter } from '../../lib/prompts/util-prompter.ts';
import type { GracefulClusterCloudDestructor } from './cloud.ts';

class VultrGracefulPhysicalClusterDestructor implements GracefulClusterCloudDestructor {
  slug: string;

  constructor(
    private task: TaskRunner,
    private y: YamlManipulator,
    private k: KubectlUtil,
    private up: UtilPrompter,
    private sulfoxideTofu: ServiceTreeService,
    private sulfoxideHelium: ServiceTreeService,
    private virtualLandscapes: ServiceTreeLandscapePrincipal[],
    slug: string,
  ) {
    this.slug = slug;
  }

  async Run(
    [phyLandscape, phyCluster]: LandscapeCluster,
    [adminLandscape, adminCluster]: LandscapeCluster,
  ): Promise<void> {
    const phy = { landscape: phyLandscape, cluster: phyCluster };
    const admin = { landscape: adminLandscape, cluster: adminCluster };

    // common variables
    const argo = this.sulfoxideHelium;
    const tofu = this.sulfoxideTofu;
    const phyContextSlug = `${phy.landscape.slug}-${phy.cluster.principal.slug}`;
    const adminContextSlug = `${admin.landscape.slug}-${admin.cluster.principal.slug}`;
    const adminNamespaceSlug = `${argo.platform.slug}-${argo.principal.slug}`;
    const tofuDir = `./platforms/${tofu.platform.slug}/${tofu.principal.slug}`;
    const heliumDir = `./platforms/${argo.platform.slug}/${argo.principal.slug}`;
    const yamlPath = path.join(heliumDir, 'chart', `values.${admin.landscape.slug}.yaml`);

    // Update ArgoCD configurations
    await this.task.Run([
      'Update Helium Configuration',
      async () => {
        console.log(`🗑️ Removing ArgoCD configurations. Path: ${yamlPath}`);
        await this.y.Mutate(yamlPath, [
          [['connector', 'clusters', phy.landscape.slug, phy.cluster.principal.slug, 'enable'], false],
          [['connector', 'clusters', phy.landscape.slug, phy.cluster.principal.slug, 'deployAppSet'], false],
          [['connector', 'clusters', phy.landscape.slug, phy.cluster.principal.slug, 'aoa', 'enable'], false],
          [['connector', 'clusters', phy.landscape.slug, phy.cluster.principal.slug, 'destination'], ''],
        ]);
      },
    ]);

    // Apply ArgoCD configurations
    const adminPls = `${admin.landscape.slug}:${admin.cluster.set.slug}`;
    await this.task.Run([
      'Apply Helium Configuration',
      async () => {
        await $`pls ${{ raw: adminPls }}:install -- --kube-context ${adminContextSlug} --namespace ${adminNamespaceSlug}`.cwd(
          heliumDir,
        );
      },
    ]);

    // delete applications from ArgoCD
    const appsToRemove: ResourceSearch = {
      kind: 'app',
      context: adminContextSlug,
      namespace: adminNamespaceSlug,
      selector: [['atomi.cloud/cluster', phy.cluster.principal.slug]],
    };

    const deleteApps = async () => {
      console.log(`🗑️ Delete Root Application: ${phy.landscape.slug}-${phy.cluster.principal.slug}-carbon`);
      await this.k.Delete({
        kind: 'app',
        context: adminContextSlug,
        namespace: adminNamespaceSlug,
        name: `${phy.landscape.slug}-${phy.cluster.principal.slug}-carbon`,
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

    // Delete all validating webhooks
    await this.task.Run([
      'Delete Validating Webhooks',
      async () => {
        await $`kubectl --context ${phyContextSlug} delete validatingwebhookconfigurations --all`.nothrow();
      },
    ]);

    // Delete all namespaces
    await this.task.Run([
      'Delete Namespaces',
      async () => {
        for (const namespace of ['pichu', 'pikachu', 'raichu', 'sulfoxide']) {
          console.log(`  🗑️ Removing namespace: ${namespace}`);
          await this.k.DeleteNamespace({
            context: phyContextSlug,
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
    const L1G = `${phy.landscape.slug}:l1:${phy.cluster.set.slug}`;
    await this.task.Run([
      `Destroy Generic Infrastructure ${L1G}`,
      async () => {
        await $`pls ${{ raw: L1G }}:destroy -- -auto-approve`.cwd(tofuDir);
      },
    ]);

    // destroy L1 infrastructure
    const L1 = `${phy.landscape.slug}:l1:${phy.cluster.principal.slug}`;
    await this.task.Run([
      `Destroy L1 Infrastructure ${L1}`,
      async () => {
        await $`pls ${{ raw: L1 }}:state:rm -- 'kubernetes_namespace.sulfoxide'`.cwd(tofuDir).nothrow();
        await $`pls ${{ raw: L1 }}:destroy -- -auto-approve`.cwd(tofuDir);
      },
    ]);

    // destroy L0 infrastructure
    const L0 = `${phy.landscape.slug}:l0:${phy.cluster.principal.slug}`;
    await this.task.Run([
      `Destroy L0 Infrastructure ${L0}`,
      async () => {
        await $`pls ${{ raw: L0 }}:state:rm -- 'module.cluster.module.proxy_secret.kubernetes_namespace.kubernetes-access'`
          .cwd(tofuDir)
          .nothrow();
        await $`pls ${{ raw: L0 }}:destroy -- -auto-approve`.cwd(tofuDir);
      },
    ]);

    // update kubectl configurations
    await this.task.Run([
      'Retrieve Kubectl Configurations',
      async () => {
        await $`pls kubectl`;
      },
    ]);

    await this.task.Run([
      'Delete ExternalSecret in admin',
      async () => {
        for (const ns of this.virtualLandscapes.map(x => x.slug)) {
          await this.k.Delete({
            kind: 'externalsecret',
            context: adminContextSlug,
            namespace: adminNamespaceSlug,
            name: `phase-5-${ns}-${phy.cluster.principal.slug}-cluster-secret`,
          });
        }
        await this.k.Delete({
          kind: 'externalsecret',
          context: adminContextSlug,
          namespace: adminNamespaceSlug,
          name: `${phy.landscape.slug}-${phy.cluster.principal.slug}-external-secret`,
        });
        await this.k.Delete({
          kind: 'externalsecret',
          context: adminContextSlug,
          namespace: adminNamespaceSlug,
          name: `${phy.landscape.slug}-${phy.cluster.principal.slug}-external-secret-bearer-token`,
        });
        await this.k.Delete({
          kind: 'externalsecret',
          context: adminContextSlug,
          namespace: adminNamespaceSlug,
          name: `${phy.landscape.slug}-${phy.cluster.principal.slug}-external-secret-ca-crt`,
        });
      },
    ]);

    // delete pointers to old cluster in admin
    await this.task.Run([
      'Delete SecretStore in admin',
      async () => {
        for (const ns of this.virtualLandscapes.map(x => x.slug)) {
          await this.k.Delete({
            kind: 'secretstore',
            context: adminContextSlug,
            namespace: adminNamespaceSlug,
            name: `phase-5-${ns}-${phy.cluster.principal.slug}`,
          });
        }
      },
    ]);
  }
}

export { VultrGracefulPhysicalClusterDestructor };
