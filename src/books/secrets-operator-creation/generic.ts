import type { CloudTreeCluster, ServiceTreeService } from '../../lib/service-tree-def.ts';
import { input, password } from '@inquirer/prompts';
import { $ } from 'bun';
import path from 'node:path';
import type { TaskRunner } from '../../tasks/tasks.ts';
import type { UtilPrompter } from '../../lib/prompts/util-prompter.ts';
import type { YamlManipulator } from '../../lib/utility/yaml-manipulator.ts';

class GenericSecretOperatorCreator {
  constructor(
    private task: TaskRunner,
    private up: UtilPrompter,
    private y: YamlManipulator,
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

    // prompt to check if we want new secrets
    const newSecrets = await this.up.YesNo(`Do you want to inject new secrets for ${cluster.principal.name}?`);
    if (newSecrets) {
      await this.task.Run([
        'Inject new secrets',
        async () => {
          const token = await input({ message: `Enter your ${cluster.cloud.name} token` });

          const yamlPath = path.join(i_path, 'bw.secrets.yaml');
          await this.y.Mutate(yamlPath, [[['Tokens', cluster.cloud.name, cluster.principal.name], token]]);

          console.log('✅ Secrets modified. Remember to update Bitwarden the new secrets');

          let updated = false;

          while (!updated) {
            updated = await this.up.YesNo('Have you updated Bitwarden with the new secrets?');
          }
        },
      ]);
    }

    // synchronize secrets
    await this.task.Run([
      'Synchronize secrets',
      async () => {
        await $`nix develop -c pls sync`.cwd(i_path);
      },
    ]);

    await this.task.Run([
      'Initialize general (database and ingress) Tofu',
      async () => {
        await $`pls general:init`.cwd(i_path);
      },
    ]);

    await this.task.Run([
      'Apply general (database and ingress) Tofu',
      async () => {
        await $`pls general:apply -- -auto-approve`.cwd(i_path);
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
      'Provision compute',
      async () => {
        await $`pls ${{ raw: compute }}:init`.cwd(i_path);
      },
    ]);

    await this.task.Run([
      'Apply compute',
      async () => {
        await $`pls ${{ raw: compute }}:apply -- -auto-approve`.cwd(i_path);
      },
    ]);

    // deploy secrets operator
    const c = cluster.principal.slug;
    await this.task.Run([
      'Deploy secrets operator',
      async () => {
        await $`nix develop -c pls deploy -- ${{ raw: c }}`.cwd(i_path).env({
          ANSIBLE_HOST_KEY_CHECKING: 'False',
        });
      },
    ]);
  }
}

export { GenericSecretOperatorCreator };
