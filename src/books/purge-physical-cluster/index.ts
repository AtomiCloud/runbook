import type { RunBook } from "../run-book.ts";
import type { ServiceTreePrompter } from "../../lib/prompts/landscape.ts";
import type { ServiceTreePrinter } from "../../lib/utility/service-tree-printer.ts";
import { GenericPhysicalClusterCloudPurger } from "./cloud.ts";

class PhysicalClusterPurger implements RunBook {
  name: string = "Purge Physical Cluster";
  desc: string = "Purge an physical cluster that has been forcefully removed";

  constructor(
    private stp: ServiceTreePrompter,
    private printer: ServiceTreePrinter,
    private genericCloudPurger: GenericPhysicalClusterCloudPurger
  ) {
  }

  async Run(): Promise<void> {
    const [admin, phy] = await this.stp.AdminPhysicalLandscapeCluster();

    // output selected service tree for confirmation
    console.log("🎯 Selected Service Tree to create");
    this.printer.Print("admin", admin);
    this.printer.Print("phy", phy);

    await this.genericCloudPurger.Run(admin, phy);
    console.log("✅ Done!");
  }
}

export { PhysicalClusterPurger };
