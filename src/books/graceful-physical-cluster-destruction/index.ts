import type { RunBook } from "../run-book.ts";
import type { ServiceTreePrompter } from "../../lib/prompts/landscape.ts";
import type { ServiceTreePrinter } from "../../lib/utility/service-tree-printer.ts";
import type { GenericGracefulPhysicalClusterDestructor } from "./generic.ts";

class GracefulPhysicalClusterDestructor implements RunBook {
  name: string = "Graceful Physical Cluster Destruction";
  desc: string = "Gracefully Destroy a physical Kubernetes cluster";

  constructor(
    private stp: ServiceTreePrompter,
    private p: ServiceTreePrinter,
    private destructor: GenericGracefulPhysicalClusterDestructor,
  ) {}

  async Run(): Promise<void> {
    // prompt user for physical landscape and cluster
    const [[phyLandscape, phyCluster], [adminLandscape, adminCluster]] =
      await this.stp.AdminPhysicalLandscapeCluster();

    // output selected service tree for confirmation
    console.log("🎯 Selected Service Tree for graceful destruction:");
    this.p.Print("Physical", [phyLandscape, phyCluster]);
    this.p.Print("Admin", [adminLandscape, adminCluster]);

    await this.destructor.Run(
      [phyLandscape, phyCluster],
      [adminLandscape, adminCluster],
    );
  }
}

export { GracefulPhysicalClusterDestructor };
