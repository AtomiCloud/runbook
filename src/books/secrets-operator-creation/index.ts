import type { CloudTreeCluster } from '../../lib/service-tree-def.ts';
import type { ServiceTreePrompter } from '../../lib/prompts/landscape.ts';
import type { RunBook } from '../run-book.ts';
import { GenericSecretOperatorCreator } from './generic.ts';

class SecretsOperatorCreator implements RunBook {
  constructor(
    private creator: GenericSecretOperatorCreator,
    private stp: ServiceTreePrompter,
  ) {}

  name: string = 'Create Secrets Operator';
  desc: string = 'Deploy the secrets operator to a selected cloud-cluster';

  async Run(): Promise<void> {
    const cluster: CloudTreeCluster = await this.stp.Cluster(
      'Which cloud do you want to create infisical in?',
      'Which cluster do you want to create infisical in?',
    );

    await this.creator.Run(cluster);
  }
}

export { SecretsOperatorCreator };
