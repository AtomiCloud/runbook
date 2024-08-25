import type { PhysicalClusterCloudCreator } from "./cloud.ts";
import { $ } from "bun";
import * as path from "node:path";
import type { UtilPrompter } from "../../lib/prompts/util-prompter.ts";
import { input } from "@inquirer/prompts";
import type { YamlManipulator } from "../../lib/utility/yaml-manipulator.ts";
import type { KubectlUtil } from "../../lib/utility/kubectl-util.ts";
import type {
  LandscapeCluster,
  ServiceTreeService,
} from "../../lib/service-tree-def.ts";
import type { TaskRunner } from "../../tasks/tasks.ts";

class DigitalOceanPhysicalClusterCreator
  implements PhysicalClusterCloudCreator
{
  slug: string;

  constructor(
    private task: TaskRunner,
    private y: YamlManipulator,
    private up: UtilPrompter,
    private k: KubectlUtil,
    private sulfoxide_tofu: ServiceTreeService,
    private sulfoxide_helium: ServiceTreeService,
    slug: string,
  ) {
    this.slug = slug;
  }

  async Run(
    [phyLandscape, phyCluster]: LandscapeCluster,
    [adminLandscape, adminCluster]: LandscapeCluster,
  ): Promise<void> {
    // constants
    const tofu = this.sulfoxide_tofu;
    const helium = this.sulfoxide_helium;
    const tofuDir = `./platforms/${tofu.platform.slug}/${tofu.principal.slug}`;
    const heliumDir = `./platforms/${helium.platform.slug}/${helium.principal.slug}`;

    const yamlPath = path.join(
      heliumDir,
      "chart",
      `values.${adminLandscape.slug}.${adminCluster.set.slug}.yaml`,
    );
    const adminContextSlug = `${adminLandscape.slug}-${adminCluster.principal.slug}`;
    const adminNamespaceSlug = `${helium.platform.slug}-${helium.principal.slug}`;

    // Check if we want to inject the DO secrets
    const doSecrets = await this.up.YesNo(
      "Do you want to inject Digital Ocean secrets?",
    );
    if (doSecrets) {
      const token = await input({ message: "Enter your Digital Ocean token" });
      await $`infisical secrets set --projectId=${tofu.principal.projectId} --env=${phyLandscape.slug} ${phyCluster.principal.slug.toUpperCase()}_DIGITALOCEAN_TOKEN=${token}`;
      console.log("✅ Digital Ocean secrets injected");
    }

    await this.task.Run([
      "Build L0 Infrastructure",
      async () => {
        await $`pls setup`.cwd(tofuDir);
        await $`pls ${phyLandscape.slug}:l0:${phyCluster.principal.slug}:init`.cwd(
          tofuDir,
        );
        await $`pls ${phyLandscape.slug}:l0:${phyCluster.principal.slug}:apply`.cwd(
          tofuDir,
        );
      },
    ]);

    await this.task.Run([
      "Retrieve Kubectl Configurations",
      async () => {
        await $`pls kubectl`;
      },
    ]);

    // extract endpoint to use
    console.log("📤 Extract endpoint to use...");
    const output =
      await $`pls ${phyLandscape.slug}:l0:${phyCluster.principal.slug}:output -- -json`
        .cwd(tofuDir)
        .json();
    const endpoint = output.cluster_endpoint.value;
    console.log(`✅ Extracted endpoint: ${endpoint}`);

    // build L1 generic infrastructure
    await this.task.Run([
      "Build L1 Generic Infrastructure",
      async () => {
        await $`pls ${phyLandscape.slug}:l1:${phyCluster.set.slug}:init`.cwd(
          tofuDir,
        );
        await $`pls ${phyLandscape.slug}:l1:${phyCluster.set.slug}:apply`.cwd(
          tofuDir,
        );
      },
    ]);

    // build L1 infrastructure
    await this.task.Run([
      "Build L1 Infrastructure",
      async () => {
        await $`pls ${phyLandscape.slug}:l1:${phyCluster.principal.slug}:init`.cwd(
          tofuDir,
        );
        await $`pls ${phyLandscape.slug}:l1:${phyCluster.principal.slug}:apply`.cwd(
          tofuDir,
        );
      },
    ]);

    // retrieve yaml in helium folder and replace
    await this.task.Run([
      "Update Helium Configuration",
      async () => {
        await this.y.Mutate(yamlPath, [
          [
            [
              "connector",
              "clusters",
              phyLandscape.slug,
              phyCluster.principal.slug,
              "enable",
            ],
            true,
          ],
          [
            [
              "connector",
              "clusters",
              phyLandscape.slug,
              phyCluster.principal.slug,
              "deployAppSet",
            ],
            true,
          ],
          [
            [
              "connector",
              "clusters",
              phyLandscape.slug,
              phyCluster.principal.slug,
              "aoa",
              "enable",
            ],
            true,
          ],
          [
            [
              "connector",
              "clusters",
              phyLandscape.slug,
              phyCluster.principal.slug,
              "destination",
            ],
            endpoint,
          ],
        ]);
      },
    ]);

    // apply ArgoCD configurations
    await this.task.Run([
      "Apply Helium Configuration",
      async () => {
        await $`pls ${adminLandscape.slug}:${adminCluster.set.slug}:install -- --kube-context ${adminContextSlug} -n ${adminNamespaceSlug}`.cwd(
          heliumDir,
        );
      },
    ]);

    // retrieve kubectl configurations again
    await this.task.Run([
      "Retrieve Kubectl Configurations",
      async () => {
        await $`pls kubectl`;
      },
    ]);

    // wait for iodine to be ready
    console.log("🕙 Waiting for iodine to be ready...");

    await this.task.Exec([
      "Wait for iodine applications to be ready",
      async () => {
        await this.k.WaitForApplications(3, {
          kind: "app",
          context: adminContextSlug,
          namespace: adminNamespaceSlug,
          selector: [
            ["atomi.cloud/sync-wave", "wave-5"],
            ["atomi.cloud/landscape", phyLandscape.slug],
            ["atomi.cloud/cluster", phyCluster.principal.slug],
          ],
        });
      },
    ]);

    await this.task.Exec([
      "Wait for statefulset (etcd) to be ready",
      async () => {
        for (const ns of ["pichu", "pikachu", "raichu"]) {
          await this.k.WaitForReplicas({
            kind: "statefulset",
            context: `${phyLandscape.slug}-${phyCluster.principal.slug}`,
            namespace: ns,
            name: `${phyLandscape.slug}-${ns}-iodine-etcd`,
          });
        }
      },
    ]);

    await this.task.Exec([
      "Wait for deployment (iodine) to be ready",
      async () => {
        for (const ns of ["pichu", "pikachu", "raichu"]) {
          await this.k.WaitForReplicas({
            kind: "deployment",
            context: `${phyLandscape.slug}-${phyCluster.principal.slug}`,
            namespace: ns,
            name: `${phyLandscape.slug}-${ns}-iodine`,
          });
        }
      },
    ]);

    // retrieve kubectl configurations again
    await this.task.Run([
      "Retrieve Kubectl Configurations",
      async () => {
        await $`pls kubectl`;
      },
    ]);

    // last applications to be ready
    await this.task.Exec([
      "Wait for vcluster carbon's last sync wave to be ready",
      async () => {
        await this.k.WaitForApplications(3, {
          kind: "app",
          context: adminContextSlug,
          namespace: adminNamespaceSlug,
          selector: [
            ["atomi.cloud/sync-wave", "wave-5"],
            ["atomi.cloud/element", "silicon"],
            ["atomi.cloud/cluster", phyCluster.principal.slug],
          ],
        });
      },
    ]);
  }
}

export { DigitalOceanPhysicalClusterCreator };
