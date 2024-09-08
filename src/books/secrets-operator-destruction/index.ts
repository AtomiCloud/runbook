import type { CloudTreeCluster, ServiceTreeService } from '../../lib/service-tree-def.ts';
import type { TaskRunner } from '../../tasks/tasks.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import { $ } from 'bun';
import { password } from '@inquirer/prompts';
import type { RunBook } from '../run-book.ts';

class SecretsOperatorDestructor implements RunBook {
  constructor(
    private task: TaskRunner,
    private stp: ServiceTreePrompter,
    private sulfoxide_infisical: ServiceTreeService,
  ) {}

  name: string = 'Destroy Secrets Operator';
  desc: string = 'Teardown the secrets operator to a selected cloud-cluster';

  async Run(): Promise<void> {
    const cluster: CloudTreeCluster = await this.stp.Cluster(
      'Which cloud do you want to create infisical in?',
      'Which cluster do you want to create infisical in?',
    );

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

export { SecretsOperatorDestructor };
