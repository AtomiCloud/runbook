import type { RunBook } from "../run-book.ts";
import type { ServiceTreePrompter } from "../../lib/prompts/landscape.ts";
import type { ServiceTreePrinter } from "../../lib/utility/service-tree-printer.ts";
import type { GenericGracefulAdminClusterDestructor } from "./generic.ts";

class GracefulAdminClusterDestructor implements RunBook {
  name: string = "Graceful Admin Cluster Destruction";
  desc: string = "Gracefully Destroy a admin Kubernetes cluster";

  constructor(
    private stp: ServiceTreePrompter,
    private p: ServiceTreePrinter,
    private destructor: GenericGracefulAdminClusterDestructor,
  ) {}

  async Run(): Promise<void> {
    // prompt user for physical landscape and cluster
    const [adminLandscape, adminCluster] =
      await this.stp.AdminLandscapeCluster();

    // output selected service tree for confirmation
    console.log("🎯 Selected Service Tree for graceful destruction:");
    this.p.Print("", [adminLandscape, adminCluster]);

    await this.destructor.Run([adminLandscape, adminCluster]);
  }
}

export { GracefulAdminClusterDestructor };
