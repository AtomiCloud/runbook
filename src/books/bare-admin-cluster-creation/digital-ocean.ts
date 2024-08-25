import type { TaskRunner } from "../../tasks/tasks.ts";
import type { UtilPrompter } from "../../lib/prompts/util-prompter.ts";
import type {
  LandscapeCluster,
  ServiceTreeService,
} from "../../lib/service-tree-def.ts";
import { input } from "@inquirer/prompts";
import { $ } from "bun";
import type { BareAdminClusterCloudCreator } from "./cloud.ts";
import type { KubectlUtil } from "../../lib/utility/kubectl-util.ts";

class DigitalOceanBareAdminClusterCreator
  implements BareAdminClusterCloudCreator
{
  slug: string;

  constructor(
    private task: TaskRunner,
    private up: UtilPrompter,
    private k: KubectlUtil,
    private sulfoxideTofu: ServiceTreeService,
    private sulfoxideFluorine: ServiceTreeService,
    slug: string,
  ) {
    this.slug = slug;
  }

  async Run([landscape, cluster]: LandscapeCluster): Promise<void> {
    // constants
    const admin = { landscape, cluster };
    const tofu = this.sulfoxideTofu;
    const fluorine = this.sulfoxideFluorine;
    const tofuDir = `./platforms/${tofu.platform.slug}/${tofu.principal.slug}`;
    const fluorineDir = `./platforms/${fluorine.platform.slug}/${fluorine.principal.slug}`;
    const context = `${admin.landscape.slug}-${admin.cluster.principal.slug}`;

    // Check if we want to inject the DO secrets
    const doSecrets = await this.up.YesNo(
      "Do you want to inject Digital Ocean secrets?",
    );
    if (doSecrets) {
      const token = await input({ message: "Enter your Digital Ocean token" });
      await $`infisical secrets set --projectId=${tofu.principal.projectId} --env=${admin.landscape.slug} ${admin.cluster.principal.slug.toUpperCase()}_DIGITALOCEAN_TOKEN=${token}`;
      console.log(
        `✅ Digital Ocean secrets for '${admin.landscape.name}' '${admin.cluster.principal.name} injected`,
      );
    }

    const L0 = `${admin.landscape.slug}:l0:${admin.cluster.principal.slug}`;
    await this.task.Run([
      "Build L0 Infrastructure",
      async () => {
        await $`pls setup`.cwd(tofuDir);
        await $`pls ${{ raw: L0 }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L0 }}:apply`.cwd(tofuDir);
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
    const output = await $`pls ${{ raw: L0 }}:output -- -json`
      .cwd(tofuDir)
      .json();
    const endpoint = output.cluster_endpoint.value;
    console.log(`✅ Extracted endpoint: ${endpoint}`);

    // build L1 generic infrastructure
    const L1G = `${admin.landscape.slug}:l1:${admin.cluster.set.slug}`;
    const L1 = `${admin.landscape.slug}:l1:${admin.cluster.principal.slug}`;
    await this.task.Run([
      "Build L1 Generic Infrastructure",
      async () => {
        await $`pls ${{ raw: L1G }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L1G }}:apply`.cwd(tofuDir);
      },
    ]);

    // build L1 infrastructure
    await this.task.Run([
      "Build L1 Infrastructure",
      async () => {
        await $`pls ${{ raw: L1 }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L1 }}:apply`.cwd(tofuDir);
      },
    ]);

    // setup velero backup engine
    await this.task.Run([
      "Setup Velero Backup Engine",
      async () => {
        await $`nix develop -c pls setup`.cwd(fluorineDir);
      },
    ]);

    // install velero backup engine
    await this.task.Run([
      "Install Velero Backup Engine",
      async () => {
        await $`nix develop -c pls velero:${{ raw: admin.landscape.slug }}:install -- --kubecontext ${{ raw: context }}`.cwd(
          fluorineDir,
        );
      },
    ]);

    await this.task.Run([
      "Wait for Velero to be ready",
      async () => {
        await this.k.WaitForReplicas({
          namespace: "velero",
          name: "velero",
          context: context,
          kind: "deployment",
        });
        await $`kubectl --context ${{ raw: context }} -n velero wait --for=jsonpath=.status.phase=Available --timeout=6000s BackupStorageLocation default`;
      },
    ]);
  }
}

export { DigitalOceanBareAdminClusterCreator };