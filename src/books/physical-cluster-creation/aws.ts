import type { PhysicalClusterCloudCreator } from "./cloud.ts";
import { $ } from "bun";
import * as path from "node:path";
import type { UtilPrompter } from "../../lib/prompts/util-prompter.ts";
import { input } from "@inquirer/prompts";
import type { YamlManipulator } from "../../lib/utility/yaml-manipulator.ts";
import type { KubectlUtil } from "../../lib/utility/kubectl-util.ts";
import type { LandscapeCluster, ServiceTreeService } from "../../lib/service-tree-def.ts";
import type { TaskRunner } from "../../tasks/tasks.ts";
import type { Git } from "../../lib/utility/git.ts";

class AwsPhysicalClusterCreator implements PhysicalClusterCloudCreator {
  slug: string;

  constructor(
    private task: TaskRunner,
    private y: YamlManipulator,
    private up: UtilPrompter,
    private k: KubectlUtil,
    private g: Git,
    private sulfoxideTofu: ServiceTreeService,
    private sulfoxideHelium: ServiceTreeService,
    private sulfoxideKrypton: ServiceTreeService,
    private sulfoxideLead: ServiceTreeService,
    slug: string
  ) {
    this.slug = slug;
  }

  async Run(
    [phyLandscape, phyCluster]: LandscapeCluster,
    [adminLandscape, adminCluster]: LandscapeCluster
  ): Promise<void> {
    // constants
    const tofu = this.sulfoxideTofu;
    const He = this.sulfoxideHelium;
    const Kr = this.sulfoxideKrypton;
    const Pb = this.sulfoxideLead;

    const tofuDir = `./platforms/${tofu.platform.slug}/${tofu.principal.slug}`;
    const He_Dir = `./platforms/${He.platform.slug}/${He.principal.slug}`;
    const Kr_Dir = `./platforms/${Kr.platform.slug}/${Kr.principal.slug}`;
    const Pb_Dir = `./platforms/${Pb.platform.slug}/${Pb.principal.slug}`;

    const He_YamlPath = path.join(He_Dir, "chart", `values.${adminLandscape.slug}.${adminCluster.set.slug}.yaml`);
    const Kr_YamlPath = path.join(Kr_Dir, "chart", `values.${phyLandscape.slug}.${phyCluster.principal.slug}.yaml`);
    const Pb_YamlPath = path.join(Pb_Dir, "chart", `values.${phyLandscape.slug}.${phyCluster.principal.slug}.yaml`);

    const aCtx = `${adminLandscape.slug}-${adminCluster.principal.slug}`;
    const aNS = `${He.platform.slug}-${He.principal.slug}`;

    // Check if we want to inject the DO secrets
    const awsSecrets = await this.up.YesNo("Do you want to inject AWS secrets?");
    if (awsSecrets) {
      const access = await input({ message: "Enter your AWS Access Key" });
      await $`infisical secrets set --projectId=${tofu.principal.projectId} --env=${phyLandscape.slug} ${phyCluster.principal.slug.toUpperCase()}_AWS_ACCESS_KEY=${access}`;
      console.log("✅ AWS Access Key injected");
      const secret = await input({ message: "Enter your AWS Secret Key" });
      await $`infisical secrets set --projectId=${tofu.principal.projectId} --env=${phyLandscape.slug} ${phyCluster.principal.slug.toUpperCase()}_AWS_SECRET_KEY=${secret}`;
      console.log("✅ AWS Secret Key injected");
    }

    const L0 = `${phyLandscape.slug}:l0:${phyCluster.principal.slug}`;
    await this.task.Run([
      "Build L0 Infrastructure",
      async () => {
        await $`pls setup`.cwd(tofuDir);
        await $`pls ${{ raw: L0 }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L0 }}:apply`.cwd(tofuDir);
      }
    ]);

    await this.task.Run([
      "Retrieve Kubectl Configurations",
      async () => {
        await $`pls kubectl`;
      }
    ]);

    // extract endpoint to use
    console.log("📤 Extract endpoint to use...");
    const output = await $`pls ${{ raw: L0 }}:output -- -json`.cwd(tofuDir).json();
    const endpoint = output.cluster_endpoint.value;
    console.log(`✅ Extracted endpoint: ${endpoint}`);

    // build L1 generic infrastructure
    const L1G = `${phyLandscape.slug}:l1:${phyCluster.set.slug}`;
    await this.task.Run([
      "Build L1 Generic Infrastructure",
      async () => {
        await $`pls ${{ raw: L1G }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L1G }}:apply`.cwd(tofuDir);
      }
    ]);

    // Propagate Tofu outputs for Karpenter
    const nodeRole = output.karpenter_node_role_name.value;
    const nodeArn = output.karpenter_role_arn.value;
    console.log("📤 Extract node role and ARN to use...");
    console.log(`✅ Extracted node role: ${nodeRole}`);
    console.log(`✅ Extracted node ARN: ${nodeArn}`);

    await this.task.Run([
      "Propagate Tofu outputs to Krypton (Karpenter)",
      async () => {
        console.log(`🛣️ Propagating YAML Path: ${Kr_YamlPath}`);
        await this.y.Mutate(Kr_YamlPath, [
          [["nodeRole"], nodeRole],
          [["karpenterRole"], nodeArn],
        ]);
      }
    ]);

    await this.task.Run([
      "Commit changes to Krypton",
      async () => {
        await this.g.CommitAndPush(Kr_Dir, "action: propagate Tofu outputs to Krypton");
      }
    ]);

    // propagate Tofu outputs for Lead
    const irsaRoleArn = output.irsa_role_arn.value;
    const vpcId = output.vpc_id.value;
    console.log("📤 Extract IRSA Role ARN and VPC ID to use...");
    console.log(`✅ Extracted IRSA Role ARN: ${irsaRoleArn}`);
    console.log(`✅ Extracted VPC ID: ${vpcId}`);
    await this.task.Run([
      "Propagate Tofu outputs to Lead (IRSA Components)",
      async () => {
        await this.y.Mutate(Pb_YamlPath, [
          [["role"], irsaRoleArn],
          [["vpcId"], vpcId],
        ]);
      }
    ]);

    await this.task.Run([
      "Commit changes to Lead",
      async () => {
        await this.g.CommitAndPush(Pb_Dir, "action: propagate Tofu outputs to Lead");
      }
    ]);

    // build L1 infrastructure
    const L1 = `${phyLandscape.slug}:l1:${phyCluster.principal.slug}`;
    await this.task.Run([
      "Build L1 Infrastructure",
      async () => {
        await $`pls ${{ raw: L1 }}:init`.cwd(tofuDir);
        await $`pls ${{ raw: L1 }}:apply`.cwd(tofuDir);
      }
    ]);

    // retrieve yaml in helium folder and replace
    await this.task.Run([
      "Update Helium Configuration",
      async () => {
        await this.y.Mutate(He_YamlPath, [
          [["connector", "clusters", phyLandscape.slug, phyCluster.principal.slug, "enable"], true],
          [["connector", "clusters", phyLandscape.slug, phyCluster.principal.slug, "deployAppSet"], true],
          [["connector", "clusters", phyLandscape.slug, phyCluster.principal.slug, "aoa", "enable"], true],
          [["connector", "clusters", phyLandscape.slug, phyCluster.principal.slug, "destination"], endpoint]
        ]);
      }
    ]);

    // apply ArgoCD configurations
    const HePls = `${adminLandscape.slug}:${adminCluster.set.slug}`;
    await this.task.Run([
      "Apply Helium Configuration",
      async () => {
        await $`pls ${{ raw: HePls }}:install -- --kube-context ${aCtx} -n ${aNS}`.cwd(He_Dir);
      }
    ]);

    // retrieve kubectl configurations again
    await this.task.Run([
      "Retrieve Kubectl Configurations",
      async () => {
        await $`pls kubectl`;
      }
    ]);

    // wait for iodine to be ready
    console.log("🕙 Waiting for iodine to be ready...");

    await this.task.Exec([
      "Wait for iodine applications to be ready",
      async () => {
        await this.k.WaitForApplications(3, {
          kind: "app",
          context: aCtx,
          namespace: aNS,
          selector: [
            ["atomi.cloud/sync-wave", "wave-5"],
            ["atomi.cloud/landscape", phyLandscape.slug],
            ["atomi.cloud/cluster", phyCluster.principal.slug]
          ]
        });
      }
    ]);

    await this.task.Exec([
      "Wait for statefulset (etcd) to be ready",
      async () => {
        for (const ns of ["pichu", "pikachu", "raichu"]) {
          await this.k.WaitForReplica({
            kind: "statefulset",
            context: `${phyLandscape.slug}-${phyCluster.principal.slug}`,
            namespace: ns,
            name: `${phyLandscape.slug}-${ns}-iodine-etcd`
          });
        }
      }
    ]);

    await this.task.Exec([
      "Wait for deployment (iodine) to be ready",
      async () => {
        for (const ns of ["pichu", "pikachu", "raichu"]) {
          await this.k.WaitForReplica({
            kind: "deployment",
            context: `${phyLandscape.slug}-${phyCluster.principal.slug}`,
            namespace: ns,
            name: `${phyLandscape.slug}-${ns}-iodine`
          });
        }
      }
    ]);

    // retrieve kubectl configurations again
    await this.task.Run([
      "Retrieve Kubectl Configurations",
      async () => {
        await $`pls kubectl`;
      }
    ]);

    // last applications to be ready
    await this.task.Exec([
      "Wait for vcluster carbon's last sync wave to be ready",
      async () => {
        await this.k.WaitForApplications(3, {
          kind: "app",
          context: aCtx,
          namespace: aNS,
          selector: [
            ["atomi.cloud/sync-wave", "wave-5"],
            ["atomi.cloud/element", "silicon"],
            ["atomi.cloud/cluster", phyCluster.principal.slug]
          ]
        });
      }
    ]);
  }
}

export { AwsPhysicalClusterCreator };
