import type { Task } from './tasks.ts';
import type { CloudTreeClusterPrincipal } from '../lib/service-tree-def.ts';
import { $ } from 'bun';

class LoadBalancerDNSSwitcher {
  constructor(
    private external: string,
    private internal: string,
  ) {}

  name: string = 'Switching DNS for Load Balancing';

  task(from: CloudTreeClusterPrincipal, target: CloudTreeClusterPrincipal): Task {
    return [
      this.name,
      async () => {
        console.log(`🚧 Switching DNS from ${from.name} to ${target.name}`);
        const path = `./platforms/sulfoxide/tofu`;
        await $`nix develop -c pls setup`.cwd(path);
        await $`nix develop -c pls arceus:apply -- -var="target_cluster=${{ raw: target.slug }}" -auto-approve `.cwd(
          path,
        );
        console.log(`✅ DNS now points to ${target.name}`);
        await $`sleep 120`;
        console.log('🔍 Checking if DNS has propagated...');

        const query = async (): Promise<string> => {
          console.log(`🖥️ dog pichu.${this.external} -J`);
          const result = await $`dog pichu.${this.external} -J`.cwd(path).json();
          const answers: { name: string; type: string; data: { domain: string } }[] = result.responses[0].answers;
          return answers.find(x => x.type === 'CNAME')?.data.domain ?? '';
        };
        const t = `${target.slug}.${this.internal}.`;
        let domain = await query();
        while (domain != t) {
          console.log(`⏳ Waiting for DNS to propagate...`);
          await $`sleep 5`;
          domain = await query();
          console.log(`✅ Check: ${domain}, Target: ${t}`);
        }
        console.log(`✅ DNS propagated!`);
      },
    ];
  }
}

export { LoadBalancerDNSSwitcher };
