import pc from 'picocolors';
import type { UtilPrompter } from '../lib/prompts/util-prompter.ts';

// name, action
interface ComplexTask {
  name: string;
  task: () => Promise<boolean | void>;
}

type SimpleTask = [string, () => Promise<boolean | void>];

type Task = SimpleTask | ComplexTask;

class TaskRunner {
  constructor(private up: UtilPrompter) {}

  extractName(task: Task): string {
    if (Array.isArray(task)) {
      return task[0];
    }
    return task.name;
  }

  extractAction(task: Task): () => Promise<boolean | void> {
    if (Array.isArray(task)) {
      return task[1];
    }
    return task.task;
  }

  /**
   * Run a task without asking
   * @param t Task to run
   * @constructor
   */
  async Exec(t: Task): Promise<void> {
    const name = this.extractName(t);
    const task = this.extractAction(t);
    const quoted = `'${pc.magenta(name)}'`;
    while (true) {
      try {
        console.log(pc.cyan(`🏃 Running task ${quoted}...`));
        const shouldExit = await task();
        if (shouldExit) process.exit(0);
        console.log(pc.green(`✅ Task ${quoted} completed`));
        break;
      } catch (e) {
        Bun.inspect(e);
        console.log(pc.red(`❌ Task ${quoted} failed`));
        const loop = await this.up.YesNo(`Do you want to retry?`);
        if (!loop) {
          // user wants to abort
          console.log(pc.red(`❌ Task ${quoted} aborted`));
          process.exit(1);
        }
      }
    }
  }

  /**
   * Run a task and ask whether to execute it or not
   * @param task task to run
   * @constructor
   */
  async Run(task: Task): Promise<void> {
    const r = await this.up.YesNoExit(`Do you want to run task '${this.extractName(task)}'?`);
    if (r === 'exit') process.exit(0);
    if (r) await this.Exec(task);
  }
}

export { type Task, TaskRunner };
