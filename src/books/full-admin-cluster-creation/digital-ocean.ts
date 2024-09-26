import { $ } from 'bun';
import type { LandscapeCluster, ServiceTreeService } from '../../lib/service-tree-def.ts';
import type { FullAdminClusterCloudCreator } from './cloud.ts';
import type { TaskRunner } from '../../tasks/tasks.ts';
import type { SulfoxideHeliumWaiter } from '../../tasks/sulfoxide-helium-waiter.ts';
import type { SulfoxideBoronWaiter } from '../../tasks/sulfoxide-boron-waiter.ts';
import type { SulfoxideFluorineCreator } from "../../tasks/sulfoxide-fluorine-creator.ts";

class DigitalOceanFullAdminClusterCreator implements FullAdminClusterCloudCreator {
  slug: string;

  constructor(
    private task: TaskRunner,
    private sulfoxideFluorineCreator: SulfoxideFluorineCreator,
    private sulfoxideHelium: ServiceTreeService,
    private sulfoxideBoron: ServiceTreeService,
    private sulfoxideHeliumWaiter: SulfoxideHeliumWaiter,
    private sulfoxideBoronWaiter: SulfoxideBoronWaiter,
    slug: string,
  ) {
    this.slug = slug;
  }

  async Run([landscape, cluster]: LandscapeCluster): Promise<void> {
    // constants
    const admin = { landscape, cluster };
    const helium = this.sulfoxideHelium;
    const boron = this.sulfoxideBoron;
    const heliumDir = `./platforms/${helium.platform.slug}/${helium.principal.slug}`;
    const boronDir = `./platforms/${boron.platform.slug}/${boron.principal.slug}`;

    const namespace = `${helium.platform.slug}-${helium.principal.slug}`;
    const context = `${admin.landscape.slug}-${admin.cluster.principal.slug}`;
    const boronNS = `${boron.platform.slug}-${boron.principal.slug}`;

    await this.task.Run([
      'Create Helium Namespace',
      async () => {
        await $`kubectl create --context ${context} ns ${namespace}`;
      },
    ]);

    await this.task.Run([
      'Create Helium Helm Release',
      async () => {
        const heliumPls = `${admin.landscape.slug}:${admin.cluster.set.slug}`;
        await $`pls ${{ raw: heliumPls }}:install -- --kube-context ${context} -n ${namespace}`.cwd(heliumDir);
      },
    ]);

    const waitForHelium = this.sulfoxideHeliumWaiter.task(context, namespace);
    await this.task.Run(waitForHelium);

    await this.task.Run([
      'Create Boron Namespace',
      async () => {
        await $`kubectl create --context ${context} ns ${boronNS}`;
      },
    ]);

    await this.task.Run([
      'Create Boron Helm Release',
      async () => {
        const boronPls = `${admin.landscape.slug}:${admin.cluster.set.slug}`;
        await $`pls ${{ raw: boronPls }}:install -- --kube-context ${context} -n ${boronNS}`.cwd(boronDir);
      },
    ]);

    const waitForBoron = this.sulfoxideBoronWaiter.task(context, namespace);
    await this.task.Run(waitForBoron);

    const createFluorineSchedule = this.sulfoxideFluorineCreator.task(admin.landscape.slug, admin.cluster.principal.slug);
    await this.task.Run(createFluorineSchedule)
  }
}

export { DigitalOceanFullAdminClusterCreator };
