import type { LandscapeCluster } from "../service-tree-def.ts";

class ServiceTreePrinter {
  Print(
    prefix: string,
    [landscape, cluster]: LandscapeCluster,
    indent: number = 2,
  ): void {
    const space = " ".repeat(indent);
    console.log(`${space}⛰️${prefix} Landscape: \t${landscape.name}`);
    console.log(`${space}☁️${prefix} Cloud:     \t${cluster.cloud.name}`);
    console.log(`${space}🌀${prefix} Cluster:   \t${cluster.principal.name}`);
    console.log(`${space}🕸️${prefix} ClusterSet:\t${cluster.set.name}`);
  }
}

export { ServiceTreePrinter };
