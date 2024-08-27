import type { RunBook } from '../run-book.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import type { ServiceTreePrinter } from '../../lib/utility/service-tree-printer.ts';
import type { BareAdminClusterCloudCreator } from './cloud.ts';

class BareAdminClusterCreator implements RunBook {
  name: string = 'Bare Admin Cluster Creation';
  desc: string = 'Create a empty admin Kubernetes cluster';

  constructor(
    private stp: ServiceTreePrompter,
    private printer: ServiceTreePrinter,
    private clouds: BareAdminClusterCloudCreator[],
  ) {}

  async Run(): Promise<void> {
    const [landscape, cluster] = await this.stp.AdminLandscapeCluster();

    // output selected service tree for confirmation
    console.log('🎯 Selected Service Tree to create');
    this.printer.Print('', [landscape, cluster]);

    const c = this.clouds.find(x => x.slug === cluster.cloud.slug);
    if (!c) return console.log('⚠️ Cloud not supported');

    await c.Run([landscape, cluster]);
  }
}

export { BareAdminClusterCreator };
