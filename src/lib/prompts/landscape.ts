import { select } from '@inquirer/prompts';
import type {
  LandscapeCluster,
  CloudTreeCloud,
  CloudTreeCluster,
  ServiceTreeLandscapePrincipal,
  CloudTreeClusterSet,
} from '../service-tree-def.ts';

class ServiceTreePrompter {
  constructor(
    private cloudTree: Record<string, CloudTreeCloud>,
    private adminLandscapes: ServiceTreeLandscapePrincipal[],
    private phyLandscapes: ServiceTreeLandscapePrincipal[],
  ) {}

  async Landscape(
    landscapes: ServiceTreeLandscapePrincipal[],
    prompt?: string,
  ): Promise<ServiceTreeLandscapePrincipal> {
    return (await select({
      message: prompt ?? 'Select landscape',
      choices: landscapes.map(x => ({
        name: x.name,
        value: x,
      })),
    })) as ServiceTreeLandscapePrincipal;
  }

  async Cluster(cloudPrompt?: string, clusterPrompt?: string): Promise<CloudTreeCluster> {
    const cloud: CloudTreeCloud = (await select<CloudTreeCloud>({
      message: cloudPrompt ?? 'Select cloud provider',
      choices: Object.entries(this.cloudTree).map(([name, c]) => ({
        name,
        value: c,
        description: c.principal.description,
      })),
    })) as CloudTreeCloud;

    const clusterSets = Object.values(this.cloudTree[cloud.principal.name].clusterSets);

    const clusterSet = (await select<CloudTreeClusterSet>({
      message: clusterPrompt ?? `Select cluster set under '${cloud.principal.name}'`,
      choices: clusterSets.map(x => ({
        name: x.principal.name,
        value: x,
        description: x.principal.description,
      })),
    })) as CloudTreeClusterSet;

    const clusters = Object.values(clusterSet.clusters);

    return (await select<CloudTreeCluster>({
      message: clusterPrompt ?? `Select cluster under '${cloud.principal.name} {${clusterSet.principal.name}}'`,
      choices: clusters.map(x => ({
        name: x.principal.name,
        value: x,
        description: x.principal.description,
      })),
    })) as CloudTreeCluster;
  }

  async AdminPhysicalLandscapeCluster(
    phyLandscapePrompt?: string,
    phyCloudPrompt?: string,
    phyClusterPrompt?: string,
    adminLandscapePrompt?: string,
    adminCloudPrompt?: string,
    adminClusterPrompt?: string,
  ): Promise<[LandscapeCluster, LandscapeCluster]> {
    const phy = await this.PhysicalLandscapeCluster(phyLandscapePrompt, phyCloudPrompt, phyClusterPrompt);
    const admin = await this.AdminLandscapeCluster(adminLandscapePrompt, adminCloudPrompt, adminClusterPrompt);
    return [phy, admin];
  }

  async PhysicalLandscapeCluster(
    phyLandscapePrompt?: string,
    phyCloudPrompt?: string,
    phyClusterPrompt?: string,
  ): Promise<LandscapeCluster> {
    return await this.LandscapeCluster(
      this.phyLandscapes,
      phyLandscapePrompt ?? 'Select physical landscape to use',
      phyCloudPrompt ?? 'Select physical cloud provider to use',
      phyClusterPrompt ?? 'Select physical cluster key to use',
    );
  }

  async AdminLandscapeCluster(
    landscapePrompt?: string,
    cloudPrompt?: string,
    clusterPrompt?: string,
  ): Promise<LandscapeCluster> {
    return await this.LandscapeCluster(
      this.adminLandscapes,
      landscapePrompt ?? 'Select admin landscape to use',
      cloudPrompt ?? 'Select admin cloud provider to use',
      clusterPrompt ?? 'Select admin cluster key to use',
    );
  }

  async LandscapeCluster(
    landscapes: ServiceTreeLandscapePrincipal[],
    landscapePrompt?: string,
    cloudPrompt?: string,
    clusterPrompt?: string,
  ): Promise<LandscapeCluster> {
    const landscape = await this.Landscape(landscapes, landscapePrompt);
    const cluster = await this.Cluster(cloudPrompt, clusterPrompt);
    return [landscape, cluster];
  }
}

export { ServiceTreePrompter };
