import type { Task } from './tasks.ts';
import type { KubectlUtil } from '../lib/utility/kubectl-util.ts';
import type { ServiceTreeService } from '../lib/service-tree-def.ts';

class SulfoxideBoronWaiter {
  constructor(
    private k: KubectlUtil,
    private sulfoxideBoron: ServiceTreeService,
  ) {}

  name: string = 'Wait for Sulfoxide Helium to be ready';

  task(context: string, namespace: string): Task {
    return [
      this.name,
      async () => {
        const boron = this.sulfoxideBoron;
        console.log('⏱️ Waiting for Boron to be ready...');
        await this.k.WaitForReplica({
          kind: 'deployment',
          context,
          namespace,
          name: `${boron.platform.slug}-${boron.principal.slug}`,
        });
        console.log('✅ Boron is ready');
      },
    ];
  }
}

export { SulfoxideBoronWaiter };
