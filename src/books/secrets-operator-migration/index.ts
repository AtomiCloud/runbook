import type { RunBook } from "../run-book.ts";

class SecretsOperatorMigrator implements RunBook {
  constructor() {
  }

  name: string = "Migrate Secrets Operator";
  desc: string = "Migrate the secrets operator to from one cloud-cluster to another";

  async Run(): Promise<void> {

  }
}

export { SecretsOperatorMigrator };
