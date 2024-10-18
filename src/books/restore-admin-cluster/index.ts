import type { RunBook } from '../run-book.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import type { ServiceTreePrinter } from '../../lib/utility/service-tree-printer.ts';
import type { BareAdminClusterCloudCreator } from '../bare-admin-cluster-creation/cloud.ts';
import type { GenericAdminClusterCloudPurger } from '../purge-admin-cluster/cloud.ts';
import type { GenericAdminClusterCloudRestorer } from './cloud.ts';

class AdminClusterRestorer implements RunBook {
  name: string = 'Restore an Admin Cluster';
  desc: string = 'Purge a lost cluster and restore cluster from backup';

  constructor(
    private stp: ServiceTreePrompter,
    private printer: ServiceTreePrinter,
    private genericCloudPurger: GenericAdminClusterCloudPurger,
    private bareClouds: BareAdminClusterCloudCreator[],
    private genericCloudRestorer: GenericAdminClusterCloudRestorer,
  ) {}

  async Run(): Promise<void> {
    const [fl, fc] = await this.stp.AdminLandscapeCluster(
      'Select the admin landscape to migrate from',
      'Select the admin cloud to migrate from',
      'Select the admin cluster to migrate from',
    );
    const [tl, tc] = await this.stp.AdminLandscapeCluster(
      'Select the admin landscape to migrate to',
      'Select the admin cloud to migrate to',
      'Select the admin cluster to migrate to',
    );

    console.log('🎯 Selected Service Tree to migrate');
    this.printer.Print('From', [fl, fc]);
    this.printer.Print('To  ', [tl, tc]);

    // create an empty cluster
    const bc = this.bareClouds.find(x => x.slug === tc.cloud.slug);
    if (!bc) return console.log('⚠️ Cloud not supported (Missing Bare Cloud Runbook');
    await bc.Run([tl, tc]);

    // purge cluster
    await this.genericCloudPurger.Run([fl, fc]);

    // restore cluster
    await this.genericCloudRestorer.Run([tl, tc]);
  }
}

export { AdminClusterRestorer };
