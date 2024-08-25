import type { Task } from "./tasks.ts";
import { SERVICE_TREE } from "../lib/service-tree.ts";
import { KubectlUtil } from "../lib/utility/kubectl-util.ts";
import { HttpUtil } from "../lib/utility/http-util.ts";

class NitrosoWaiter {
  constructor(
    private k: KubectlUtil,
    private h: HttpUtil,
  ) {}

  name: string = "Wait for Nitroso to be ready";
  services: string[] = [
    SERVICE_TREE.nitroso.services.tin.principal.slug,
    SERVICE_TREE.nitroso.services.helium.principal.slug,
    SERVICE_TREE.nitroso.services.zinc.principal.slug,
  ];

  task(
    phyLandscape: string,
    landscapes: string[],
    cluster: string,
    adminContext: string,
    adminNamespace: string,
  ): Task {
    return [
      this.name,
      async () => {
        // wait for app to be ready
        for (const phy of landscapes) {
          for (const service of this.services) {
            const name = `${phy}-${cluster}-nitroso-${service}`;
            console.log(`⏱️ Waiting for ${name} to be ready...`);
            await this.k.WaitForApplication({
              kind: "app",
              context: adminContext,
              namespace: adminNamespace,
              name,
            });
          }
        }
        // wait for SSL cert to be ready
        for (const v of landscapes) {
          const sslName = `api-zinc-nitroso-${v}-tls-x-nitroso-x-${phyLandscape}-${v}-iodine`;
          const context = `${phyLandscape}-${cluster}`;
          await this.k.Wait(1, 5, {
            kind: "certificate",
            context,
            namespace: v,
            fieldSelector: [["metadata.name", sslName]],
          });
          await this.k.Wait(1, 5, {
            kind: "secret",
            context,
            namespace: v,
            fieldSelector: [["metadata.name", sslName]],
          });
        }
        // wait for endpoint to be ready
        for (const v of landscapes) {
          const endpoint = `https://api.zinc.nitroso.${v}.cluster.atomi.cloud`;
          await this.h.WaitFor(5, endpoint);
        }
      },
    ];
  }
}

export { NitrosoWaiter };
