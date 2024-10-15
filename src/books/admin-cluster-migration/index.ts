import type { RunBook } from '../run-book.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import type { ServiceTreePrinter } from '../../lib/utility/service-tree-printer.ts';
import type { BareAdminClusterCloudCreator } from '../bare-admin-cluster-creation/cloud.ts';
import type { GenericGracefulAdminClusterDestructor } from '../graceful-admin-cluster-destruction/generic.ts';
import type { AdminClusterTransitioner } from './transition.ts';
import type { SulfoxideFluorineCreator } from '../../tasks/sulfoxide-fluorine-creator.ts';
import type { TaskRunner } from '../../tasks/tasks.ts';

class AdminClusterMigrator implements RunBook {
  name: string = 'Admin Cluster Migration';
  desc: string = 'Migrate an admin cluster to a new cluster';

  constructor(
    private stp: ServiceTreePrompter,
    private task: TaskRunner,
    private printer: ServiceTreePrinter,
    private clouds: BareAdminClusterCloudCreator[],
    private destructors: GenericGracefulAdminClusterDestructor,
    private transition: AdminClusterTransitioner,
    private sulfoxideFluorineScheduler: SulfoxideFluorineCreator,
  ) {}

  async Run(): Promise<void> {
    const [fromLandscape, fromCluster] = await this.stp.AdminLandscapeCluster(
      'Select the admin landscape to migrate from',
      'Select the admin cloud to migrate from',
      'Select the admin cluster to migrate from',
    );
    const [toLandscape, toCluster] = await this.stp.AdminLandscapeCluster(
      'Select the admin landscape to migrate to',
      'Select the admin cloud to migrate to',
      'Select the admin cluster to migrate to',
    );

    console.log('🎯 Selected Service Tree to migrate');
    this.printer.Print('From', [fromLandscape, fromCluster]);
    this.printer.Print('To  ', [toLandscape, toCluster]);

    // select the cloud to create the new cluster in
    const c = this.clouds.find(x => x.slug === toCluster.cloud.slug);
    if (!c) return console.log('⚠️ Cloud not supported');

    await c.Run([toLandscape, toCluster]);

    // perform transition
    await this.transition.Run([fromLandscape, fromCluster], [toLandscape, toCluster]);

    // destroy old cluster
    await this.destructors.Run([fromLandscape, fromCluster]);

    // create schedule
    const backupScheduler = this.sulfoxideFluorineScheduler.task(toLandscape.slug, toCluster.principal.slug);
    await this.task.Run(backupScheduler);
  }
}

export { AdminClusterMigrator };
