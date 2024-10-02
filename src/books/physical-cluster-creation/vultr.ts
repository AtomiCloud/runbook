import type { PhysicalClusterCloudCreator } from "./cloud.ts";
import { $ } from "bun";
import * as path from "node:path";
import type { UtilPrompter } from "../../lib/prompts/util-prompter.ts";
import { input } from "@inquirer/prompts";
import type { YamlManipulator } from "../../lib/utility/yaml-manipulator.ts";
import type { KubectlUtil } from "../../lib/utility/kubectl-util.ts";
import type { LandscapeCluster, ServiceTreeService } from "../../lib/service-tree-def.ts";
import type { TaskRunner } from "../../tasks/tasks.ts";

class VultrPhysicalClusterCreator implements PhysicalClusterCloudCreator {
  slug: string;

  constructor(
    private task: TaskRunner,
    private y: YamlManipulator,
    private up: UtilPrompter,
    private k: KubectlUtil,
    private sulfoxideTofu: ServiceTreeService,
    private sulfoxideHelium: ServiceTreeService,
    slug: string,
  ) {
    this.slug = slug;
  }

  async Run(
    [phyLandscape, phyCluster]: LandscapeCluster,
    [adminLandscape, adminCluster]: LandscapeCluster,
  ): Promise<void> {
    // constants
    const tofu = this.sulfoxideTofu;
    const He = this.sulfoxideHelium;

    const tofuDir = `./platforms/${tofu.platform.slug}/${tofu.principal.slug}`;
    const He_Dir = `./platforms/${He.platform.slug}/${He.principal.slug}`;

    const He_YamlPath = path.join(He_Dir, 'chart', `values.${adminLandscape.slug}.yaml`);
    const aCtx = `${adminLandscape.slug}-${adminCluster.principal.slug}`;
    const aNS = `${He.platform.slug}-${He.principal.slug}`;

    // Check if we want to inject the DO secrets
    const vultrSecret = await this.up.YesNo('Do you want to inject Vultr API Token?');
    if (vultrSecret) {
      const access = await input({ message: 'Enter your Vultr API Token' });
      await $`infisical secrets set --projectId=${tofu.principal.projectId} --env=${phyLandscape.slug} ${phyCluster.principal.slug.toUpperCase()}_VULTR_TOKEN=${access}`;
      console.log('✅ Vultr API Token injected');
    }

    const L0 = `${phyLandscape.slug}:l0:${phyCluster.principal.slug}`;
    await this.task.Run([
      `Build L0 Infrastructure ${L0}`,
      async () => {
        await $`pls setup`.cwd(tofuDir);
        await $`pls ${{ raw: L0 }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L0 }}:apply -- -auto-approve`.cwd(tofuDir);
      },
    ]);

    await this.task.Run([
      'Retrieve Kubectl Configurations',
      async () => {
        await $`pls kubectl`;
      },
    ]);

    // extract endpoint to use
    console.log('📤 Extract endpoint to use...');
    const output = await $`pls ${{ raw: L0 }}:output -- -json`.cwd(tofuDir).json();
    const endpoint = output.cluster_endpoint.value;
    console.log(`✅ Extracted endpoint: ${endpoint}`);

    // build L1 generic infrastructure
    const L1G = `${phyLandscape.slug}:l1:${phyCluster.set.slug}`;
    await this.task.Run([
      `Build L1 Generic Infrastructure ${L1G}`,
      async () => {
        await $`pls ${{ raw: L1G }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L1G }}:apply -- -auto-approve`.cwd(tofuDir);
      },
    ]);

    // build L1 infrastructure
    const L1 = `${phyLandscape.slug}:l1:${phyCluster.principal.slug}`;
    await this.task.Run([
      `Build L1 Infrastructure ${L1}`,
      async () => {
        await $`pls ${{ raw: L1 }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L1 }}:apply -- -auto-approve`.cwd(tofuDir);
      },
    ]);

    // retrieve yaml in helium folder and replace
    await this.task.Run([
      'Update Helium Configuration',
      async () => {
        await this.y.Mutate(He_YamlPath, [
          [['connector', 'clusters', phyLandscape.slug, phyCluster.principal.slug, 'enable'], true],
          [['connector', 'clusters', phyLandscape.slug, phyCluster.principal.slug, 'deployAppSet'], true],
          [['connector', 'clusters', phyLandscape.slug, phyCluster.principal.slug, 'aoa', 'enable'], true],
          [['connector', 'clusters', phyLandscape.slug, phyCluster.principal.slug, 'destination'], endpoint],
        ]);
      },
    ]);

    // apply ArgoCD configurations
    const HePls = `${adminLandscape.slug}:${adminCluster.set.slug}`;
    await this.task.Run([
      'Apply Helium Configuration',
      async () => {
        await $`pls ${{ raw: HePls }}:install -- --kube-context ${aCtx} -n ${aNS}`.cwd(He_Dir);
      },
    ]);

    // retrieve kubectl configurations again
    await this.task.Run([
      'Retrieve Kubectl Configurations',
      async () => {
        await $`pls kubectl`;
      },
    ]);

    // wait for iodine to be ready
    console.log('🕙 Waiting for iodine to be ready...');

    await this.task.Exec([
      'Wait for iodine applications to be ready',
      async () => {
        await this.k.WaitForApplications(3, {
          kind: 'app',
          context: aCtx,
          namespace: aNS,
          selector: [
            ['atomi.cloud/sync-wave', 'wave-4'],
            ['atomi.cloud/landscape', phyLandscape.slug],
            ['atomi.cloud/cluster', phyCluster.principal.slug],
          ],
        });
      },
    ]);

    await this.task.Exec([
      'Wait for statefulset (etcd) to be ready',
      async () => {
        for (const ns of ['pichu', 'pikachu', 'raichu']) {
          await this.k.WaitForReplica({
            kind: 'statefulset',
            context: `${phyLandscape.slug}-${phyCluster.principal.slug}`,
            namespace: ns,
            name: `${phyLandscape.slug}-${ns}-iodine-etcd`,
          });
        }
      },
    ]);

    await this.task.Exec([
      'Wait for deployment (iodine) to be ready',
      async () => {
        for (const ns of ['pichu', 'pikachu', 'raichu']) {
          await this.k.WaitForReplica({
            kind: 'deployment',
            context: `${phyLandscape.slug}-${phyCluster.principal.slug}`,
            namespace: ns,
            name: `${phyLandscape.slug}-${ns}-iodine`,
          });
        }
      },
    ]);

    // retrieve kubectl configurations again
    await this.task.Run([
      'Retrieve Kubectl Configurations',
      async () => {
        await $`pls kubectl`;
      },
    ]);

    // last applications to be ready
    await this.task.Exec([
      "Wait for vcluster carbon's last sync wave to be ready",
      async () => {
        await this.k.WaitForApplications(3, {
          kind: 'app',
          context: aCtx,
          namespace: aNS,
          selector: [
            ['atomi.cloud/sync-wave', 'wave-5'],
            ['atomi.cloud/element', 'silicon'],
            ['atomi.cloud/cluster', phyCluster.principal.slug],
          ],
        });
      },
    ]);
  }
}

export { VultrPhysicalClusterCreator };
