import type { LandscapeCluster } from "../../lib/service-tree-def.ts";

interface BareAdminClusterCloudCreator {
  slug: string;

  Run(admin: LandscapeCluster): Promise<void>;
}

export type { BareAdminClusterCloudCreator };
