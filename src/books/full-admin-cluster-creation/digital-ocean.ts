import { $ } from "bun";
import type {
  LandscapeCluster,
  ServiceTreeService,
} from "../../lib/service-tree-def.ts";
import type { FullAdminClusterCloudCreator } from "./cloud.ts";
import type { TaskRunner } from "../../tasks/tasks.ts";
import type { KubectlUtil } from "../../lib/utility/kubectl-util.ts";

class DigitalOceanFullAdminClusterCreator
  implements FullAdminClusterCloudCreator
{
  slug: string;

  constructor(
    private task: TaskRunner,
    private k: KubectlUtil,
    private sulfoxideHelium: ServiceTreeService,
    private sulfoxideBoron: ServiceTreeService,
    slug: string,
  ) {
    this.slug = slug;
  }

  async Run([landscape, cluster]: LandscapeCluster): Promise<void> {
    // constants
    const admin = { landscape, cluster };
    const helium = this.sulfoxideHelium;
    const boron = this.sulfoxideBoron;
    const heliumDir = `./platforms/${helium.platform.slug}/${helium.principal.slug}`;
    const boronDir = `./platforms/${boron.platform.slug}/${boron.principal.slug}`;

    const namespace = `${helium.platform.slug}-${helium.principal.slug}`;
    const context = `${admin.landscape.slug}-${admin.cluster.principal.slug}`;
    const boronNS = `${boron.platform.slug}-${boron.principal.slug}`;

    await this.task.Run([
      "Create Helium Namespace",
      async () => {
        await $`kubectl create --context ${context} ns ${namespace}`;
      },
    ]);

    await this.task.Run([
      "Create Helium Helm Release",
      async () => {
        const heliumPls = `${admin.landscape.slug}:${admin.cluster.set.slug}`;
        await $`pls ${{ raw: heliumPls }}:install -- --kube-context ${{ raw: context }} -n ${{ raw: namespace }}`.cwd(
          heliumDir,
        );
      },
    ]);

    console.log("⏱️ Waiting for Helium to be ready...");
    const prefix = `${helium.platform.slug}-${helium.principal.slug}-argocd`;
    await this.k.WaitForReplicas({
      kind: "deployment",
      context,
      namespace,
      name: `${prefix}-server`,
    });
    await this.k.WaitForReplicas({
      kind: "deployment",
      context,
      namespace,
      name: `${prefix}-repo-server`,
    });
    await this.k.WaitForReplicas({
      kind: "deployment",
      context,
      namespace,
      name: `${prefix}-redis`,
    });
    await this.k.WaitForReplicas({
      kind: "deployment",
      context,
      namespace,
      name: `${prefix}-notifications-controller`,
    });
    await this.k.WaitForReplicas({
      kind: "deployment",
      context,
      namespace,
      name: `${prefix}-applicationset-controller`,
    });
    console.log("✅ Helium is ready");

    await this.task.Run([
      "Create Boron Namespace",
      async () => {
        await $`kubectl create --context ${context} ns ${boronNS}`;
      },
    ]);

    await this.task.Run([
      "Create Boron Helm Release",
      async () => {
        const boronPls = `${admin.landscape.slug}:${admin.cluster.set.slug}`;
        await $`pls ${{ raw: boronPls }}:install -- --kube-context ${{ raw: context }} -n ${{ raw: boronNS }}`.cwd(
          boronDir,
        );
      },
    ]);

    console.log("⏱️ Waiting for Boron to be ready...");
    await this.k.WaitForReplicas({
      kind: "deployment",
      context,
      namespace,
      name: `${boron.platform.slug}-${boron.principal.slug}`,
    });
    console.log("✅ Boron is ready");
  }
}

export { DigitalOceanFullAdminClusterCreator };
