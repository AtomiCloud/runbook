import { NitrosoWaiter } from '../tasks/nitroso-waiter.ts';
import type { Dependencies } from './index.ts';
import { SulfoxideHeliumWaiter } from '../tasks/sulfoxide-helium-waiter.ts';
import { SulfoxideBoronWaiter } from '../tasks/sulfoxide-boron-waiter.ts';
import { SERVICE_TREE } from '../lib/service-tree.ts';
import { SulfoxideXenonWaiter } from '../tasks/sulfoxide-xenon-waiter.ts';
import { SulfoxideFluorineCreator } from "../tasks/sulfoxide-fluorine-creator.ts";

interface TaskGenerator {
  nitrosoWaiter: NitrosoWaiter;
  sulfoxideHeliumWaiter: SulfoxideHeliumWaiter;
  sulfoxideBoronWaiter: SulfoxideBoronWaiter;
  sulfoxideXenonWaiter: SulfoxideXenonWaiter;
  sulfoxideFluorineCreator: SulfoxideFluorineCreator;
}

function initTasks(d: Dependencies): TaskGenerator {
  const services = SERVICE_TREE.sulfoxide.services;
  return {
    nitrosoWaiter: new NitrosoWaiter(d.kubectl, d.httpUtil),
    sulfoxideHeliumWaiter: new SulfoxideHeliumWaiter(d.kubectl, services.argocd),
    sulfoxideBoronWaiter: new SulfoxideBoronWaiter(d.kubectl, services.internal_ingress),
    sulfoxideXenonWaiter: new SulfoxideXenonWaiter(d.kubectl, services.metricsServer),
    sulfoxideFluorineCreator: new SulfoxideFluorineCreator(services.backup_engine)
  };
}

export { initTasks, type TaskGenerator };
