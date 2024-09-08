import { password } from '@inquirer/prompts';
import { $ } from 'bun';
import type { CloudTreeCluster, ServiceTreeService } from '../../lib/service-tree-def.ts';
import type { TaskRunner } from '../../tasks/tasks.ts';

class GenericSecretOperatorDestructor {
  constructor(
    private task: TaskRunner,
    private sulfoxide_infisical: ServiceTreeService,
  ) {}

  async Run(cluster: CloudTreeCluster): Promise<void> {
    const infisical = this.sulfoxide_infisical;

    const i_path = `./platforms/${infisical.platform.slug}/${infisical.principal.slug}`;

    await this.task.Run([
      'Setup infisical',
      async () => {
        const pw = await password({ message: 'Enter your Bitwarden password' });

        await $`echo ${pw} | nix develop -c pls setup`.cwd(i_path);
      },
    ]);

    await this.task.Run([
      'Initialize general (database and ingress) Tofu',
      async () => {
        await $`pls general:init`.cwd(i_path);
      },
    ]);

    await this.task.Run([
      'Destroy general (database and ingress) Tofu',
      async () => {
        await $`pls general:destroy`.cwd(i_path);
      },
    ]);

    await this.task.Run([
      'Generate .env',
      async () => {
        await $`nix develop -c pls generate:env`.cwd(i_path);
      },
    ]);

    // provision compute
    const compute = cluster.principal.slug;
    await this.task.Run([
      'Init Compute',
      async () => {
        await $`pls ${{ raw: compute }}:init`.cwd(i_path);
      },
    ]);

    await this.task.Run([
      'Destroy compute',
      async () => {
        await $`pls ${{ raw: compute }}:destroy -- -auto-approve`.cwd(i_path);
      },
    ]);
  }
}

export { GenericSecretOperatorDestructor };
