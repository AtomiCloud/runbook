import type { LandscapeCluster } from '../../lib/service-tree-def.ts';

interface PhysicalClusterCloudCreator {
  slug: string;

  Run(phy: LandscapeCluster, admin: LandscapeCluster): Promise<void>;
}

export type { PhysicalClusterCloudCreator };
