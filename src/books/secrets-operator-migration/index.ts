import type { RunBook } from "../run-book.ts";
import { GenericSecretOperatorCreator } from "../secrets-operator-creation/generic.ts";
import { GenericSecretOperatorDestructor } from "../secrets-operator-destruction/generic.ts";
import type { ServiceTreePrompter } from "../../lib/prompts/landscape.ts";

class SecretsOperatorMigrator implements RunBook {
  constructor(
    private creator: GenericSecretOperatorCreator,
    private destructor: GenericSecretOperatorDestructor,
    private stp: ServiceTreePrompter
  ) {

  }

  name: string = "Migrate Secrets Operator";
  desc: string = "Migrate the secrets operator to from one cloud-cluster to another";

  async Run(): Promise<void> {
    const fromCluster = await this.stp.Cluster("Which cloud do you want to migrate infisical from?", "Which cluster do you want to migrate infisical from?");
    const toCluster = await this.stp.Cluster("Which cloud do you want to migrate infisical to?", "Which cluster do you want to migrate infisical to?");

    await this.creator.Run(toCluster);
    await this.destructor.Run(fromCluster);
  }
}

export { SecretsOperatorMigrator };
