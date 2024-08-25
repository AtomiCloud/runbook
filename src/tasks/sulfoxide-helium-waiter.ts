import type { Task } from "./tasks.ts";
import type { KubectlUtil } from "../lib/utility/kubectl-util.ts";
import type { ServiceTreeService } from "../lib/service-tree-def.ts";

class SulfoxideHeliumWaiter {
  constructor(
    private k: KubectlUtil,
    private sulfoxideHelium: ServiceTreeService,
  ) {}

  name: string = "Wait for Sulfoxide Helium to be ready";

  task(context: string, namespace: string): Task {
    return [
      this.name,
      async () => {
        const helium = this.sulfoxideHelium;
        const prefix = `${helium.platform.slug}-${helium.principal.slug}-argocd`;
        const deployments = [
          `${prefix}-server`,
          `${prefix}-repo-server`,
          `${prefix}-redis`,
          `${prefix}-notifications-controller`,
          `${prefix}-applicationset-controller`,
        ];
        for (const name of deployments) {
          console.log(`🚧 Waiting for ${name} to be ready...`);
          await this.k.WaitForReplica({
            kind: "deployment",
            context,
            namespace,
            name,
          });
          console.log(`✅ ${name} is ready`);
        }
        console.log(`🚧 Waiting for statefulset to be ready...`);
        await this.k.WaitForReplica({
          kind: "statefulset",
          context,
          namespace,
          name: `${prefix}-application-controller`,
        });
        console.log(`✅ Statefulset is ready`);
      },
    ];
  }
}

export { SulfoxideHeliumWaiter };
