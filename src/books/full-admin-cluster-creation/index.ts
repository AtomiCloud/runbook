import type { RunBook } from '../run-book.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import type { ServiceTreePrinter } from '../../lib/utility/service-tree-printer.ts';
import type { FullAdminClusterCloudCreator } from './cloud.ts';
import type { BareAdminClusterCloudCreator } from '../bare-admin-cluster-creation/cloud.ts';

class FullAdminClusterCreator implements RunBook {
  name: string = 'Full Admin Cluster Creation';
  desc: string = 'Create a fully-featured admin Kubernetes cluster';

  constructor(
    private stp: ServiceTreePrompter,
    private printer: ServiceTreePrinter,
    private bareClouds: BareAdminClusterCloudCreator[],
    private fullClouds: FullAdminClusterCloudCreator[],
  ) {}

  async Run(): Promise<void> {
    const [landscape, cluster] = await this.stp.AdminLandscapeCluster();

    // output selected service tree for confirmation
    console.log('🎯 Selected Service Tree to create');
    this.printer.Print('', [landscape, cluster]);

    const bc = this.bareClouds.find(x => x.slug === cluster.cloud.slug);
    if (!bc) return console.log('⚠️ Cloud not supported (Missing Bare Cloud Runbook');
    await bc.Run([landscape, cluster]);

    const fc = this.fullClouds.find(x => x.slug === cluster.cloud.slug);
    if (!fc) return console.log('⚠️ Cloud not supported (Missing Full Cloud Runbook');
    await fc.Run([landscape, cluster]);
  }
}

export { FullAdminClusterCreator };
