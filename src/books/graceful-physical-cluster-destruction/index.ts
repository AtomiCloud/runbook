import type { RunBook } from '../run-book.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import type { ServiceTreePrinter } from '../../lib/utility/service-tree-printer.ts';
import type { GracefulPhysicalClusterCloudDestructor } from './cloud.ts';

class GracefulPhysicalClusterDestructor implements RunBook {
  name: string = 'Graceful Physical Cluster Destruction';
  desc: string = 'Gracefully Destroy a physical Kubernetes cluster';

  constructor(
    private stp: ServiceTreePrompter,
    private p: ServiceTreePrinter,
    private clouds: GracefulPhysicalClusterCloudDestructor[],
  ) {}

  async Run(): Promise<void> {
    // prompt user for physical landscape and cluster
    const [[phyLandscape, phyCluster], [adminLandscape, adminCluster]] = await this.stp.AdminPhysicalLandscapeCluster();

    // output selected service tree for confirmation
    console.log('🎯 Selected Service Tree for graceful destruction:');
    this.p.Print('Physical', [phyLandscape, phyCluster]);
    this.p.Print('Admin', [adminLandscape, adminCluster]);

    const destructor = this.clouds.find(x => x.slug === phyCluster.cloud.slug);
    if (!destructor) return console.log('⚠️ Cloud not supported');

    await destructor.Run([phyLandscape, phyCluster], [adminLandscape, adminCluster]);
  }
}

export { GracefulPhysicalClusterDestructor };
