import type { Task } from './tasks.ts';
import type { KubectlUtil } from '../lib/utility/kubectl-util.ts';
import type { ServiceTreeService } from '../lib/service-tree-def.ts';

class SulfoxideXenonWaiter {
  constructor(
    private k: KubectlUtil,
    private sulfoxideXenon: ServiceTreeService,
  ) {}

  name: string = 'Wait for Sulfoxide Xenon to be ready';

  task(context: string, namespace: string): Task {
    return [
      this.name,
      async () => {
        const Xe = this.sulfoxideXenon;
        const name = `${Xe.platform.slug}-${Xe.principal.slug}-metrics-server`;
        console.log(`🚧 Waiting for deployment ${name} to be ready...`);
        await this.k.WaitForReplica({
          kind: 'deployment',
          context,
          namespace,
          name,
        });
        console.log(`✅ Deployment is ${name} ready`);
      },
    ];
  }
}

export { SulfoxideXenonWaiter };
