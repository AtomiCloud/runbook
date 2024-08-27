import { $ } from 'bun';
import type { UtilPrompter } from '../prompts/util-prompter.ts';

interface ResourceSearch {
  kind: string;
  context: string;
  namespace: string;
  selector?: [string, string][];
  fieldSelector?: [string, string][];
}

interface Resource {
  kind: string;
  context: string;
  namespace: string;
  name: string;
}

interface NamespaceSearch {
  context: string;
  namespace: string;
}

interface Intervention {
  count: number;
  action?: () => Promise<boolean>;
}

class KubectlUtil {
  constructor(private up: UtilPrompter) {}

  private async generateFlags(search: ResourceSearch): Promise<string> {
    const selectorFlag = (search.selector ?? []).length > 0 ? '--selector=' : '';
    const selector = `${selectorFlag}${(search.selector ?? []).map(([k, v]) => `${k}=${v}`).join(',')}`;
    const findFlag = (search.fieldSelector ?? []).length > 0 ? '--field-selector=' : '';
    const fieldSelector = `${findFlag}${(search.fieldSelector ?? []).map(([k, v]) => `${k}=${v}`).join(',')}`;
    return `${selector} ${fieldSelector}`;
  }

  async Scale(r: Resource, replicas: number): Promise<void> {
    const cmds = $.escape(
      `kubectl scale --context ${r.context} -n ${r.namespace} ${r.kind} ${r.name} --replicas=${replicas}`,
    );
    console.log(`🖥️ Scale Execute Command: ${cmds}`);
    await $`kubectl scale --context ${r.context} -n ${r.namespace} ${r.kind} ${r.name} --replicas=${{ raw: replicas.toString(10) }}`;
  }

  async GetReplica(r: Resource): Promise<number> {
    const { stdout } =
      await $`kubectl get --context ${r.context} --namespace ${r.namespace} ${r.kind} ${r.name} -o jsonpath="{.status.replicas}"`.quiet();
    return parseInt(stdout.toString().trim(), 10);
  }

  async WaitForReplica(r: Resource): Promise<void> {
    const replicas = await this.GetReplica(r);
    const cmds = $.escape(
      `kubectl --context ${r.context} -n ${r.namespace} wait --for=jsonpath=.status.readyReplicas=${replicas} --timeout=600s ${r.kind} ${r.name}`,
    );
    console.log(`🖥️ WaitForReplicas Execute Command: ${cmds}`);
    await $`kubectl --context ${r.context} -n ${r.namespace} wait --for=jsonpath=.status.readyReplicas=${{ raw: replicas.toString(10) }} --timeout=600s ${r.kind} ${r.name}`;
  }

  async WaitForApplication(r: Resource): Promise<void> {
    console.log(`🚧 Waiting for ${r.kind} ${r.name} to be healthy...`);
    await this.Wait(1, 5, {
      kind: r.kind,
      context: r.context,
      namespace: r.namespace,
      fieldSelector: [['metadata.name', r.name]],
    });
    const cmds = $.escape(
      `kubectl --context ${r.context} -n ${r.namespace} wait --for=jsonpath=.status.health.status=Healthy --timeout=6000s ${r.kind} ${r.name}`,
    );
    console.log(`🖥️ WaitForApplication Execute Command: ${cmds}`);
    await $`kubectl --context ${r.context} -n ${r.namespace} wait --for=jsonpath=.status.health.status=Healthy --timeout=6000s ${r.kind} ${r.name}`;

    const cmd = $.escape(
      `kubectl --context ${r.context} -n ${r.namespace} wait --for=jsonpath=.status.sync.status=Synced --timeout=6000s ${r.kind} ${r.name}`,
    );
    console.log(`🖥️ WaitForApplication Execute Command: ${cmd}`);
    await $`kubectl --context ${r.context} -n ${r.namespace} wait --for=jsonpath=.status.sync.status=Synced --timeout=6000s ${r.kind} ${r.name}`;
  }

  async WaitForApplications(target: number, search: ResourceSearch): Promise<void> {
    await this.Wait(target, 5, search);
    const apps = await this.GetRange(search);
    const waits = apps.map(x => this.WaitForApplication(x));
    return Promise.all(waits).then(() => console.log('✅ All applications are healthy'));
  }

  async Count(search: ResourceSearch): Promise<number> {
    const resources = await this.GetRange(search);
    return resources.length;
  }

  async GetRange(search: ResourceSearch): Promise<Resource[]> {
    const flags = await this.generateFlags(search);

    const cmds = $.escape(
      `kubectl get ${search.kind} --context ${search.context} --namespace ${search.namespace} ${flags} -o json`,
    );
    console.log(`🖥️ GetRange Execute Command: ${cmds}`);

    const obj =
      await $`kubectl get ${search.kind} --context ${search.context} --namespace ${search.namespace} ${{ raw: flags }} -o json`.json();
    return obj.items.map((item: any) => ({
      kind: item.kind,
      context: search.context,
      namespace: search.namespace,
      name: item.metadata.name,
    }));
  }

  async Wait(target: number, interval: number, search: ResourceSearch, intervention?: Intervention): Promise<boolean> {
    // number of iterations
    let count = 0;

    // initial number of resources
    let ret = await this.Count(search);
    // iterate until target is reached
    while (ret != target) {
      console.log(`🚧 Waiting for all ${search.kind} to reach ${target}, current = ${ret}, index = ${count}...`);
      await $`sleep ${interval}`;
      // if intervention is configured
      if (intervention) {
        // if intervention threshold is reached
        if (count % intervention.count === 0 && count != 0) {
          // check if user wants to exit
          const shouldExit = await this.up.YesNo('Seems to be taking a long time. Do you want to exit?');
          if (shouldExit) return true;
          // provide alternative intervention action
          if (intervention.action) {
            const exit = (await intervention.action()) ?? false;
            if (exit) return true;
          }
        }
      }

      // update number of resources
      ret = await this.Count(search);
      // bump number of iterations
      count++;
    }
    console.log(`✅ ${search.kind} to reached ${target} after index ${count}!`);
    return false;
  }

  async DeleteRange(search: ResourceSearch): Promise<void> {
    const flags = await this.generateFlags(search);

    const cmds = $.escape(
      `kubectl delete ${search.kind} --context ${search.context} --namespace ${search.namespace} ${flags}`,
    );
    console.log(`🖥️ DeleteRange Execute Command: ${cmds}`);
    await $`kubectl delete ${search.kind} --context ${search.context} --namespace ${search.namespace} ${{ raw: flags }} `;
  }

  async Delete(r: Resource): Promise<void> {
    await this.DeleteRange({
      kind: r.kind,
      context: r.context,
      namespace: r.namespace,
      fieldSelector: [['metadata.name', r.name]],
    });
  }

  async DeleteNamespace(ns: NamespaceSearch): Promise<void> {
    const delNS = async () =>
      $`kubectl delete namespace --context ${ns.context} ${ns.namespace}`.then(() =>
        console.log('✅ Namespace deleted'),
      );
    const delDeployment = async () =>
      $`kubectl delete deployment --context ${ns.context} --namespace ${ns.namespace} --all`.then(() =>
        console.log('✅ Deployments deleted'),
      );
    const delStatefulSet = async () =>
      $`kubectl delete statefulset --context ${ns.context} --namespace ${ns.namespace} --all`.then(() =>
        console.log('✅ StatefulSets deleted'),
      );
    const delJob = async () =>
      $`kubectl delete job --context ${ns.context} --namespace ${ns.namespace} --all`.then(() =>
        console.log('✅ Jobs deleted'),
      );
    const delDaemonSet = async () =>
      $`kubectl delete daemonset --context ${ns.context} --namespace ${ns.namespace} --all`.then(() =>
        console.log('✅ DaemonSets deleted'),
      );
    const delCronJob = async () =>
      $`kubectl delete cronjob --context ${ns.context} --namespace ${ns.namespace} --all`.then(() =>
        console.log('✅ CronJobs deleted'),
      );
    const delPod = async () =>
      $`kubectl delete pod --context ${ns.context} --namespace ${ns.namespace} --all`.then(() =>
        console.log('✅ Pods deleted'),
      );
    const delReplicaSet = async () =>
      $`kubectl delete replicaset --context ${ns.context} --namespace ${ns.namespace} --all`.then(() =>
        console.log('✅ ReplicaSets deleted'),
      );
    const delService = async () =>
      $`kubectl delete service --context ${ns.context} --namespace ${ns.namespace} --all`.then(() =>
        console.log('✅ Services deleted'),
      );

    const finalizeNS = async () => {
      // generate random port:
      const port = Math.floor(Math.random() * 10000 + 10000);
      const timeout = $`timeout 10 kubectl --context ${ns.context} proxy -p ${port}`.then(() =>
        console.log('✅ Proxy closed'),
      );
      const wait5 = async () => await $`sleep 5`;
      const finalize = () =>
        wait5()
          .then(() =>
            $`kubectl --context ${ns.context} get ns ${ns.namespace} -o json | \
                   jq '.spec.finalizers=[]' | \
                   curl -X PUT http://localhost:${{ raw: port.toString(10) }}/api/v1/namespaces/${{ raw: ns.namespace }}/finalize -H "Content-Type: application/json" --data @-`.nothrow(),
          )
          .then(() => console.log('💪 Namespace finalizers removal attempted'));
      await Promise.all([timeout, finalize()]);
    };

    const countNS = async () =>
      await $`kubectl get --context ${ns.context} ns --field-selector=metadata.name=${{ raw: ns.namespace }} -o json`.json();

    const finalizeLoop = async () => {
      while (true) {
        const ns = await countNS();
        console.log(`🔢 NS Count: ${ns.items.length}`);
        if (ns.items.length == 0) return console.log('✅ Namespace finalizers removed');
        console.log('😔 Namespace finalizers removal failed, sleep 5 then retry...');
        await $`sleep 5`;
        console.log('💪 Namespace finalizers removal attempted');
        await finalizeNS();
      }
    };

    const count = await countNS();
    if (count.items.length == 0) return console.log('✅ Namespace already deleted');

    const wait = async () => await $`sleep 10`.then(() => console.log('✅ Buffer time over'));

    const resources: Promise<void> = Promise.all([
      delDeployment(),
      delStatefulSet(),
      delJob(),
      delDaemonSet(),
      delCronJob(),
      delPod(),
      delReplicaSet(),
      delService(),
    ])
      .then(() => console.log('✅ Resources deleted'))
      .then(wait)
      .then(finalizeLoop);
    await Promise.all([delNS(), resources]);
  }
}

export { KubectlUtil };
export type { Resource, ResourceSearch, Intervention, NamespaceSearch };
