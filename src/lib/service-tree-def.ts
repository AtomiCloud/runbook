// Landscape
interface ServiceTreeLandscapePrincipal {
  name: string;
  slug: string;
  description: string;
}

// Cloud
interface CloudTreeCloud {
  principal: CloudTreeCloudPrincipal;
  clusterSets: Record<string, CloudTreeClusterSet>;
}

interface CloudTreeCloudPrincipal {
  name: string;
  slug: string;
  description: string;
}

// Cluster Set
interface CloudTreeClusterSet {
  principal: CloudTreeClusterSetPrincipal;
  cloud: CloudTreeCloudPrincipal;
  clusters: CloudTreeCluster[];
}

interface CloudTreeClusterSetPrincipal {
  name: string;
  slug: string;
  description: string;
}

// Cluster
interface CloudTreeCluster {
  principal: CloudTreeClusterPrincipal;
  cloud: CloudTreeCloudPrincipal;
  set: CloudTreeClusterSetPrincipal;
}

interface CloudTreeClusterPrincipal {
  name: string;
  slug: string;
  description: string;
}

// Platform
interface ServiceTreePlatform {
  principal: ServiceTreePlatformPrincipal;
  services: Record<string, ServiceTreeService>;
}

interface ServiceTreePlatformPrincipal {
  name: string;
  slug: string;
  description: string;
}

// Service
interface ServiceTreeService {
  principal: ServiceTreeServicePrincipal;
  platform: ServiceTreePlatformPrincipal;
}

interface ServiceTreeServicePrincipal {
  name: string;
  slug: string;
  description: string;
  projectId: string;
}

// Cluster Selection
type LandscapeCluster = [ServiceTreeLandscapePrincipal, CloudTreeCluster];

export type {
  // L
  ServiceTreeLandscapePrincipal,

  // Cloud
  CloudTreeCloud,
  CloudTreeCloudPrincipal,

  // Cluster Set
  CloudTreeClusterSet,
  CloudTreeClusterSetPrincipal,

  // Cluster
  CloudTreeCluster,
  CloudTreeClusterPrincipal,

  // Platform
  ServiceTreePlatform,
  ServiceTreePlatformPrincipal,

  // Service
  ServiceTreeService,
  ServiceTreeServicePrincipal,
  LandscapeCluster,
};
