import { NitrosoWaiter } from "../tasks/nitroso-waiter.ts";
import type { Dependencies } from "./index.ts";

interface TaskGenerator {
  nitrosoWaiter: NitrosoWaiter;
}

function initTasks(d: Dependencies): TaskGenerator {
  return {
    nitrosoWaiter: new NitrosoWaiter(d.kubectl, d.httpUtil),
  };
}

export { initTasks, type TaskGenerator };
