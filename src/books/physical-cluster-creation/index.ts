import type { TaskRunner } from '../../tasks/tasks.ts';
import type { RunBook } from '../run-book.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import type { PhysicalClusterCloudCreator } from './cloud.ts';
import type { NitrosoWaiter } from '../../tasks/nitroso-waiter.ts';
import type { ServiceTreeLandscapePrincipal, ServiceTreeService } from '../../lib/service-tree-def.ts';

class PhysicalClusterCreator implements RunBook {
  name: string = 'Physical Cluster Creation';
  desc: string = 'Create a physical Kubernetes cluster from scratch';

  constructor(
    private task: TaskRunner,
    private stp: ServiceTreePrompter,
    private nitrosoWaiter: NitrosoWaiter,
    private sulfoxide_helium: ServiceTreeService,
    private virtualLandscapes: ServiceTreeLandscapePrincipal[],
    private clouds: PhysicalClusterCloudCreator[],
  ) {}

  async Run(): Promise<void> {
    const argo = this.sulfoxide_helium;

    const [phy, admin] = await this.stp.AdminPhysicalLandscapeCluster();

    // output selected service tree for confirmation
    console.log('🎯 Selected Service Tree to create');

    const [phyLandscape, phyCluster] = phy;
    const [adminLandscape, adminCluster] = admin;

    const c = this.clouds.find(x => x.slug === phyCluster.cloud.slug);
    if (!c) return console.log('⚠️ Cloud not supported');

    await c.Run(phy, admin);
    const adminContextSlug = `${adminLandscape.slug}-${adminCluster.principal.slug}`;
    const adminNamespaceSlug = `${argo.platform.slug}-${argo.principal.slug}`;

    // wait for nitroso to be ready
    const nitrosoTask = this.nitrosoWaiter.task(
      phyLandscape.slug,
      this.virtualLandscapes.map(x => x.slug),
      phyCluster.principal.slug,
      adminContextSlug,
      adminNamespaceSlug,
    );
    await this.task.Run(nitrosoTask);
  }
}

export { PhysicalClusterCreator };
