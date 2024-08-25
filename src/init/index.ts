import { UtilPrompter } from "../lib/prompts/util-prompter.ts";
import { HttpUtil } from "../lib/utility/http-util.ts";
import { KubectlUtil } from "../lib/utility/kubectl-util.ts";
import { ServiceTreePrinter } from "../lib/utility/service-tree-printer.ts";
import { YamlManipulator } from "../lib/utility/yaml-manipulator.ts";
import { ServiceTreePrompter } from "../lib/prompts/landscape.ts";
import { CLOUD_TREE, LANDSCAPE_TREE } from "../lib/service-tree.ts";
import { TaskRunner } from "../tasks/tasks.ts";

interface Dependencies {
  httpUtil: HttpUtil;
  utilPrompter: UtilPrompter;
  kubectl: KubectlUtil;
  serviceTreePrinter: ServiceTreePrinter;
  yamlManipulator: YamlManipulator;
  stp: ServiceTreePrompter;
  taskRunner: TaskRunner;
}

// helpers
const httpUtil = new HttpUtil();
const utilPrompter = new UtilPrompter();
const kubectl = new KubectlUtil(utilPrompter);
const serviceTreePrinter = new ServiceTreePrinter();
const yamlManipulator = new YamlManipulator();
const stp = new ServiceTreePrompter(
  CLOUD_TREE,
  LANDSCAPE_TREE.a,
  LANDSCAPE_TREE.p,
);
const taskRunner = new TaskRunner(utilPrompter);

const dependencies: Dependencies = {
  httpUtil,
  utilPrompter,
  kubectl,
  serviceTreePrinter,
  yamlManipulator,
  stp,
  taskRunner,
};

export { dependencies, type Dependencies };
