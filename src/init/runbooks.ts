import type { Dependencies } from './index.ts';
import type { TaskGenerator } from './tasks.ts';
import type { RunBook } from '../books/run-book.ts';
import type { PhysicalClusterCloudCreator } from '../books/physical-cluster-creation/cloud.ts';
import { DigitalOceanPhysicalClusterCreator } from '../books/physical-cluster-creation/digital-ocean.ts';
import { CLOUDS, LANDSCAPE_TREE, SERVICE_TREE } from '../lib/service-tree.ts';
import { PhysicalClusterCreator } from '../books/physical-cluster-creation';
import { GracefulPhysicalClusterDestructor } from '../books/graceful-physical-cluster-destruction';
import { BareAdminClusterCreator } from '../books/bare-admin-cluster-creation';
import type { BareAdminClusterCloudCreator } from '../books/bare-admin-cluster-creation/cloud.ts';
import { DigitalOceanBareAdminClusterCreator } from '../books/bare-admin-cluster-creation/digital-ocean.ts';
import type { FullAdminClusterCloudCreator } from '../books/full-admin-cluster-creation/cloud.ts';
import { DigitalOceanFullAdminClusterCreator } from '../books/full-admin-cluster-creation/digital-ocean.ts';
import { FullAdminClusterCreator } from '../books/full-admin-cluster-creation';
import { GracefulAdminClusterDestructor } from '../books/graceful-admin-cluster-destruction';
import { GenericGracefulAdminClusterDestructor } from '../books/graceful-admin-cluster-destruction/generic.ts';
import { DigitalOceanGracefulPhysicalClusterDestructor } from '../books/graceful-physical-cluster-destruction/digital-ocean.ts';
import { AdminClusterMigrator } from '../books/admin-cluster-migration';
import { AdminClusterTransitioner } from '../books/admin-cluster-migration/transition.ts';
import { AwsPhysicalClusterCreator } from '../books/physical-cluster-creation/aws.ts';
import { AwsGracefulPhysicalClusterDestructor } from '../books/graceful-physical-cluster-destruction/aws.ts';
import { VultrPhysicalClusterCreator } from "../books/physical-cluster-creation/vultr.ts";
import { VultrGracefulPhysicalClusterDestructor } from "../books/graceful-physical-cluster-destruction/vultr.ts";

function initRunBooks(d: Dependencies, t: TaskGenerator): RunBook[] {
  const sulfoxide = SERVICE_TREE.sulfoxide;

  // physical cluster creation
  const phyClusterCreators: PhysicalClusterCloudCreator[] = [
    new VultrPhysicalClusterCreator(
      d.taskRunner,
      d.yamlManipulator,
      d.utilPrompter,
      d.kubectl,
      sulfoxide.services.tofu,
      sulfoxide.services.argocd,
      CLOUDS.Vultr.slug,
    ),
    new DigitalOceanPhysicalClusterCreator(
      d.taskRunner,
      d.yamlManipulator,
      d.utilPrompter,
      d.kubectl,
      sulfoxide.services.tofu,
      sulfoxide.services.argocd,
      CLOUDS.DigitalOcean.slug,
    ),
    new AwsPhysicalClusterCreator(
      d.taskRunner,
      d.yamlManipulator,
      d.utilPrompter,
      d.kubectl,
      d.git,
      sulfoxide.services.tofu,
      sulfoxide.services.argocd,
      sulfoxide.services.cluster_scaler,
      sulfoxide.services.aws_adapter,
      CLOUDS.AWS.slug,
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
  const phyGracefulDestructors = [
    new VultrGracefulPhysicalClusterDestructor(
      d.taskRunner,
      d.yamlManipulator,
      d.kubectl,
      d.utilPrompter,
      sulfoxide.services.tofu,
      sulfoxide.services.argocd,
      LANDSCAPE_TREE.v,
      CLOUDS.Vultr.slug,
    ),
    new DigitalOceanGracefulPhysicalClusterDestructor(
      d.taskRunner,
      d.yamlManipulator,
      d.kubectl,
      d.utilPrompter,
      sulfoxide.services.tofu,
      sulfoxide.services.argocd,
      LANDSCAPE_TREE.v,
      CLOUDS.DigitalOcean.slug,
    ),
    new AwsGracefulPhysicalClusterDestructor(
      d.taskRunner,
      d.yamlManipulator,
      d.kubectl,
      d.utilPrompter,
      sulfoxide.services.tofu,
      sulfoxide.services.argocd,
      sulfoxide.services.external_ingress,
      LANDSCAPE_TREE.v,
      CLOUDS.AWS.slug,
    ),
  ];

  const phyGracefulDestructor = new GracefulPhysicalClusterDestructor(
    d.stp,
    d.serviceTreePrinter,
    phyGracefulDestructors,
  );

  // bare admin cluster creation
  const bareAdminCloudCreators: BareAdminClusterCloudCreator[] = [
    new DigitalOceanBareAdminClusterCreator(
      d.taskRunner,
      d.utilPrompter,
      d.kubectl,
      sulfoxide.services.tofu,
      sulfoxide.services.backup_engine,
      sulfoxide.services.metricsServer,
      t.sulfoxideXenonWaiter,
      CLOUDS.DigitalOcean.slug,
    ),
  ];
  const bareAdminClusterCreator = new BareAdminClusterCreator(d.stp, d.serviceTreePrinter, bareAdminCloudCreators);

  // full admin cluster creation
  const fullAdminCloudCreators: FullAdminClusterCloudCreator[] = [
    new DigitalOceanFullAdminClusterCreator(
      d.taskRunner,
      sulfoxide.services.argocd,
      sulfoxide.services.internal_ingress,
      t.sulfoxideHeliumWaiter,
      t.sulfoxideBoronWaiter,
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
  const genericAdminGracefulDestructor = new GenericGracefulAdminClusterDestructor(
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

  // admin cluster migration
  const adminClusterTransitioner = new AdminClusterTransitioner(
    d.taskRunner,
    d.kubectl,
    sulfoxide.services.argocd,
    sulfoxide.services.backup_engine,
    sulfoxide.services.internal_ingress,
    t.sulfoxideHeliumWaiter,
    t.sulfoxideBoronWaiter,
  );
  const adminClusterMigrator = new AdminClusterMigrator(
    d.stp,
    d.serviceTreePrinter,
    bareAdminCloudCreators,
    genericAdminGracefulDestructor,
    adminClusterTransitioner,
  );

  return [
    physicalClusterCreator,
    phyGracefulDestructor,
    bareAdminClusterCreator,
    fullAdminCloudCreator,
    adminGracefulDestructor,
    adminClusterMigrator,
  ];
}

export { initRunBooks };
