import type { RunBook } from "../run-book.ts";
import type { ServiceTreePrompter } from "../../lib/prompts/landscape.ts";
import type { ServiceTreePrinter } from "../../lib/utility/service-tree-printer.ts";
import type { BareAdminClusterCloudCreator } from "../bare-admin-cluster-creation/cloud.ts";
import type { GenericAdminClusterCloudPurger } from "../purge-admin-cluster/cloud.ts";
import type { GenericAdminClusterCloudRestorer } from "./cloud.ts";

class AdminClusterRestorer implements RunBook {
  name: string = "Restore an Admin Cluster";
  desc: string = "Purge a lost cluster and restore cluster from backup";

  constructor(
    private stp: ServiceTreePrompter,
    private printer: ServiceTreePrinter,
    private genericCloudPurger: GenericAdminClusterCloudPurger,
    private bareClouds: BareAdminClusterCloudCreator[],
    private genericCloudRestorer: GenericAdminClusterCloudRestorer
  ) {
  }

  async Run(): Promise<void> {
    const [landscape, cluster] = await this.stp.AdminLandscapeCluster();

    // output selected service tree for confirmation
    console.log("🎯 Selected Service Tree to create");
    this.printer.Print("", [landscape, cluster]);

    // purge cluster
    await this.genericCloudPurger.Run([landscape, cluster]);

    // create an empty cluster
    const bc = this.bareClouds.find(x => x.slug === cluster.cloud.slug);
    if (!bc) return console.log("⚠️ Cloud not supported (Missing Bare Cloud Runbook");
    await bc.Run([landscape, cluster]);

    // restore cluster
    await this.genericCloudRestorer.Run([landscape, cluster]);
  }
}

export { AdminClusterRestorer };
