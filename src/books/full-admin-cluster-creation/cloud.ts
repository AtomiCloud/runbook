import type { LandscapeCluster } from '../../lib/service-tree-def.ts';

interface FullAdminClusterCloudCreator {
  slug: string;

  Run(admin: LandscapeCluster): Promise<void>;
}

export type { FullAdminClusterCloudCreator };
