import type { RunBook } from '../run-book.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import type { ServiceTreePrinter } from '../../lib/utility/service-tree-printer.ts';
import type { GenericAdminClusterCloudPurger } from './cloud.ts';

class AdminClusterPurger implements RunBook {
  name: string = 'Purge Admin Cluster';
  desc: string = 'Purge an admin cluster that has been forcefully removed';

  constructor(
    private stp: ServiceTreePrompter,
    private printer: ServiceTreePrinter,
    private genericCloudPurger: GenericAdminClusterCloudPurger,
  ) {}

  async Run(): Promise<void> {
    const [landscape, cluster] = await this.stp.AdminLandscapeCluster();

    // output selected service tree for confirmation
    console.log('🎯 Selected Service Tree to create');
    this.printer.Print('', [landscape, cluster]);

    await this.genericCloudPurger.Run([landscape, cluster]);
    console.log('✅ Done!');
  }
}

export { AdminClusterPurger };
