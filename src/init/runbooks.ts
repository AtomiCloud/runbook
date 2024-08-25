import type { Dependencies } from "./index.ts";
import type { TaskGenerator } from "./tasks.ts";
import type { RunBook } from "../books/run-book.ts";
import type { PhysicalClusterCloudCreator } from "../books/physical-cluster-creation/cloud.ts";
import { DigitalOceanPhysicalClusterCreator } from "../books/physical-cluster-creation/digital-ocean.ts";
import { CLOUDS, LANDSCAPE_TREE, SERVICE_TREE } from "../lib/service-tree.ts";
import { PhysicalClusterCreator } from "../books/physical-cluster-creation";
import { GracefulPhysicalClusterDestructor } from "../books/graceful-physical-cluster-destruction";
import { BareAdminClusterCreator } from "../books/bare-admin-cluster-creation";
import type { BareAdminClusterCloudCreator } from "../books/bare-admin-cluster-creation/cloud.ts";
import { DigitalOceanBareAdminClusterCreator } from "../books/bare-admin-cluster-creation/digital-ocean.ts";
import type { FullAdminClusterCloudCreator } from "../books/full-admin-cluster-creation/cloud.ts";
import { DigitalOceanFullAdminClusterCreator } from "../books/full-admin-cluster-creation/digital-ocean.ts";
import { FullAdminClusterCreator } from "../books/full-admin-cluster-creation";
import { GracefulAdminClusterDestructor } from "../books/graceful-admin-cluster-destruction";
import { GenericGracefulAdminClusterDestructor } from "../books/graceful-admin-cluster-destruction/generic.ts";
import { GenericGracefulPhysicalClusterDestructor } from "../books/graceful-physical-cluster-destruction/generic.ts";

function initRunBooks(d: Dependencies, t: TaskGenerator): RunBook[] {
  const sulfoxide = SERVICE_TREE.sulfoxide;

  // physical cluster creation
  const phyClusterCreators: PhysicalClusterCloudCreator[] = [
    new DigitalOceanPhysicalClusterCreator(
      d.taskRunner,
      d.yamlManipulator,
      d.utilPrompter,
      d.kubectl,
      sulfoxide.services.tofu,
      sulfoxide.services.argocd,
      CLOUDS.DigitalOcean.slug,
    ),
  ];
  const physicalClusterCreator = new PhysicalClusterCreator(
    d.taskRunner,
    d.stp,
    t.nitrosoWaiter,
    sulfoxide.services.argocd,
    LANDSCAPE_TREE.v,
    phyClusterCreators,
  );

  // graceful physical cluster destruction
  const genericPhyGracefulDestructor =
    new GenericGracefulPhysicalClusterDestructor(
      d.taskRunner,
      d.yamlManipulator,
      d.kubectl,
      d.utilPrompter,
      sulfoxide.services.tofu,
      sulfoxide.services.argocd,
      LANDSCAPE_TREE.v,
    );

  const phyGracefulDestructor = new GracefulPhysicalClusterDestructor(
    d.stp,
    d.serviceTreePrinter,
    genericPhyGracefulDestructor,
  );

  // bare admin cluster creation
  const bareAdminCloudCreators: BareAdminClusterCloudCreator[] = [
    new DigitalOceanBareAdminClusterCreator(
      d.taskRunner,
      d.utilPrompter,
      d.kubectl,
      sulfoxide.services.tofu,
      sulfoxide.services.backup_engine,
      CLOUDS.DigitalOcean.slug,
    ),
  ];
  const bareAdminClusterCreator = new BareAdminClusterCreator(
    d.stp,
    d.serviceTreePrinter,
    bareAdminCloudCreators,
  );

  // full admin cluster creation
  const fullAdminCloudCreators: FullAdminClusterCloudCreator[] = [
    new DigitalOceanFullAdminClusterCreator(
      d.taskRunner,
      d.kubectl,
      sulfoxide.services.argocd,
      sulfoxide.services.internal_ingress,
      CLOUDS.DigitalOcean.slug,
    ),
  ];

  const fullAdminCloudCreator = new FullAdminClusterCreator(
    d.stp,
    d.serviceTreePrinter,
    bareAdminCloudCreators,
    fullAdminCloudCreators,
  );

  // graceful admin cluster destruction
  const genericAdminGracefulDestructor =
    new GenericGracefulAdminClusterDestructor(
      d.taskRunner,
      d.kubectl,
      sulfoxide.services.argocd,
      sulfoxide.services.internal_ingress,
      sulfoxide.services.tofu,
    );

  const adminGracefulDestructor = new GracefulAdminClusterDestructor(
    d.stp,
    d.serviceTreePrinter,
    genericAdminGracefulDestructor,
  );

  return [
    physicalClusterCreator,
    phyGracefulDestructor,
    bareAdminClusterCreator,
    fullAdminCloudCreator,
    adminGracefulDestructor,
  ];
}

export { initRunBooks };