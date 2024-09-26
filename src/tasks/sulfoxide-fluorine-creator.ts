import type { Task } from './tasks.ts';
import type { ServiceTreeService } from '../lib/service-tree-def.ts';
import { $ } from 'bun';

class SulfoxideFluorineCreator {
  constructor(private sulfoxideFluorine: ServiceTreeService) {}

  name: string = 'Creating scheduled backup (fluorine)';

  task(landscape: string, cluster: string): Task {
    return [
      this.name,
      async () => {
        const fluorine = this.sulfoxideFluorine;
        const context = `${landscape}-${cluster}`;

        const path = `./platforms/${fluorine.platform.slug}/${fluorine.principal.slug}`;
        await $`nix develop -c pls setup`.cwd(path);
        await $`nix develop -c pls velero:${{ raw: landscape }}:schedule -- --kubecontext ${{ raw: context }}`.cwd(
          path,
        );
      },
    ];
  }
}

export { SulfoxideFluorineCreator };
