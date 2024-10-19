import type { RunBook } from "../run-book.ts";
import type { ServiceTreePrompter } from "../../lib/prompts/landscape.ts";
import type { ServiceTreePrinter } from "../../lib/utility/service-tree-printer.ts";
import { PhysicalClusterTransitioner } from "./transition.ts";
import type { PhysicalClusterCloudCreator } from "../physical-cluster-creation/cloud.ts";
import type { GracefulPhysicalClusterCloudDestructor } from "../graceful-physical-cluster-destruction/cloud.ts";

class PhysicalClusterMigrator implements RunBook {
  name: string = 'Physical Cluster Migration';
  desc: string = 'Migrate an physical cluster to a new cluster';

  constructor(
    private stp: ServiceTreePrompter,
    private printer: ServiceTreePrinter,
    private creators: PhysicalClusterCloudCreator[],
    private destructors: GracefulPhysicalClusterCloudDestructor[],
    private transition: PhysicalClusterTransitioner,
  ) {}

  async Run(): Promise<void> {
    const [adminLandscape, adminCluster] = await this.stp.AdminLandscapeCluster();

    const [fromLandscape, fromCluster] = await this.stp.PhysicalLandscapeCluster(
      'Select the physical landscape to migrate from',
      'Select the physical cloud to migrate from',
      'Select the physical cluster to migrate from',
    );
    const [toLandscape, toCluster] = await this.stp.PhysicalLandscapeCluster(
      'Select the physical landscape to migrate to',
      'Select the physical cloud to migrate to',
      'Select the physical cluster to migrate to',
    );

    console.log('🎯 Selected Service Tree to migrate');
    this.printer.Print('Admin', [adminLandscape, adminCluster]);
    this.printer.Print('From', [fromLandscape, fromCluster]);
    this.printer.Print('To  ', [toLandscape, toCluster]);

    // select the cloud to create the new cluster in
    const c = this.creators.find(x => x.slug === toCluster.cloud.slug);
    if (!c) return console.log('⚠️ Cloud not supported');

    await c.Run([toLandscape, toCluster], [adminLandscape, adminCluster]);

    // perform transition
    await this.transition.Run([fromLandscape, fromCluster], [toLandscape, toCluster]);

    // destroy old cluster
    const d = this.destructors.find(x => x.slug === fromCluster.cloud.slug);
    if (!d) return console.log('⚠️ Cloud not supported');

    await d.Run([fromLandscape, fromCluster], [adminLandscape, adminCluster]);
  }
}

export { PhysicalClusterMigrator };
