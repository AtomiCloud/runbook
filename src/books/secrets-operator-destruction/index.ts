import type { CloudTreeCluster } from "../../lib/service-tree-def.ts";
import type { ServiceTreePrompter } from "../../lib/prompts/landscape.ts";
import type { RunBook } from "../run-book.ts";
import type { GenericSecretsOperatorDestructor } from "./generic.ts";

class SecretsOperatorDestructor implements RunBook {
  constructor(
    private destructor: GenericSecretsOperatorDestructor,
    private stp: ServiceTreePrompter
  ) {
  }

  name: string = "Destroy Secrets Operator";
  desc: string = "Teardown the secrets operator to a selected cloud-cluster";

  async Run(): Promise<void> {
    const cluster: CloudTreeCluster = await this.stp.Cluster(
      "Which cloud do you want to create infisical in?",
      "Which cluster do you want to create infisical in?"
    );

    await this.destructor.Run(cluster);


  }
}

export { SecretsOperatorDestructor };
