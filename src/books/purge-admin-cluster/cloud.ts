import type { LandscapeCluster, ServiceTreeService } from "../../lib/service-tree-def.ts";
import { $ } from "bun";
import postgres from "postgres";
import type { TaskRunner } from "../../tasks/tasks.ts";

class GenericAdminClusterCloudPurger {

  constructor(
    private task: TaskRunner,
    private projectId: string,
    private env: string,
    private tofuKey: string,
    private kubernetesAccess: ServiceTreeService,
    private sulfoxideHelium: ServiceTreeService
  ) {
  }

  async Run([landscape, cluster]: LandscapeCluster): Promise<void> {

    const l = landscape.slug;
    const c = cluster.principal.slug;

    const Ka = this.kubernetesAccess;
    const He = this.sulfoxideHelium;

    const KaPID = Ka.principal.projectId;
    const KaKey = `${c.toUpperCase()}_KUBECONFIG`;

    const HePID = He.principal.projectId;
    const HeKey = `${l.toUpperCase()}_${c.toUpperCase()}_KUBECONFIG`;


    const rootFlags = `--projectId=${this.projectId} --env=${this.env} ${this.tofuKey}`;
    const secret = await $`infisical secrets get --plain ${{ raw: rootFlags }}`.text();

    // setup connection to tofu
    const sql = postgres(secret);

    await this.task.Run(["Check database reachability", async () => {
      try {
        await sql`SELECT 1`;
      } catch (e) {
        console.log("❌ Database not reachable");
        await sql.end();
        throw e;
      }
    }]);

    await this.task.Run(["Deleting L0 States", async () => {
      const table = `${l}-l0-${c}`;
      try {
        await sql`DELETE FROM ${ sql(table) }.states`;
      } catch (e) {
        await sql.end();
        throw e;
      }
    }]);

    await this.task.Run(["Deleting L1 States", async () => {
      const table = `${l}-l1-${c}`;
      try {
        await sql`DELETE FROM ${ sql(table) }.states`;
      } catch (e) {
        await sql.end();
        throw e;
      }
    }]);

    await sql.end();

    await this.task.Run([`Deleting Kubernetes Access for ${l} ${c}`, async () => {
      const kaFlag = `--projectId=${KaPID} --env=${landscape.slug} --type=shared ${KaKey}`;
      console.log("⛳ Flags: ", kaFlag);
      await $`infisical secrets delete ${{ raw: kaFlag }}`;
    }]);

    await this.task.Run([`Deleting Sulfoxide Helium for ${l} ${c}`, async () => {
      const heFlag = `--projectId=${HePID} --env=${landscape.slug} --type=shared ${HeKey}`;
      console.log("⛳ Flags: ", heFlag);
      await $`infisical secrets delete ${{ raw: heFlag }}`;
    }]);



  }
}

export { GenericAdminClusterCloudPurger };
