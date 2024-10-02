import type { LandscapeCluster, ServiceTreeService } from '../../lib/service-tree-def.ts';
import type { TaskRunner } from '../../tasks/tasks.ts';
import { KubectlUtil } from '../../lib/utility/kubectl-util.ts';
import type { SulfoxideFluorineCreator } from '../../tasks/sulfoxide-fluorine-creator.ts';
import { $ } from 'bun';

class GenericAdminClusterCloudRestorer {
  constructor(
    private task: TaskRunner,
    private k: KubectlUtil,
    private sulfoxideFluorine: ServiceTreeService,
    private sulfoxideFluorineScheduler: SulfoxideFluorineCreator,
  ) {}

  async Run([adminLandscape, adminCluster]: LandscapeCluster): Promise<void> {
    const F = this.sulfoxideFluorine;
    const F_Dir = `./platforms/${F.platform.slug}/${F.principal.slug}`;

    // restore admin cluster from backup
    const context = `${adminLandscape.slug}-${adminCluster.principal.slug}`;
    let backupName = '';

    await this.task.Run([
      'Get Backup Name',
      async () => {
        const backups = await this.k.GetRange({
          context,
          namespace: 'velero',
          selector: [['velero.io/schedule-name', adminLandscape.slug]],
          kind: 'backup',
        });

        const sortedBackup = backups.toSorted().reverse();
        if (sortedBackup.length == 0) {
          console.log('❌ No backups found');
          throw new Error('No backups found');
        }

        backupName = sortedBackup[0].name;
        console.log(`✅ Found backup ${backupName}`);
      },
    ]);

    await this.task.Run([
      'Restore Backup',
      async () => {
        await $`nix develop -c velero --kubecontext ${{ raw: context }} restore create --from-backup ${{ raw: backupName }}`.cwd(
          F_Dir,
        );
      },
    ]);

    // start backup scheduler
    const backupScheduler = this.sulfoxideFluorineScheduler.task(adminLandscape.slug, adminCluster.principal.slug);
    await this.task.Run(backupScheduler);
  }
}

export { GenericAdminClusterCloudRestorer };
