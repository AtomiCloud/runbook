import type { LandscapeCluster } from '../../lib/service-tree-def.ts';
import type { TaskRunner } from '../../tasks/tasks.ts';
import type { LoadBalancerDNSSwitcher } from '../../tasks/lb-dns-switcher.ts';

class PhysicalClusterTransitioner {
  constructor(
    private t: TaskRunner,
    private dnsSwitcher: LoadBalancerDNSSwitcher,
  ) {}

  async Run([, fC]: LandscapeCluster, [, tC]: LandscapeCluster): Promise<void> {
    const task = this.dnsSwitcher.task(fC.principal, tC.principal);
    await this.t.Run(task);
  }
}

export { PhysicalClusterTransitioner };
