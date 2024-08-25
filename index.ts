import { search } from "@inquirer/prompts";
import { dependencies } from "./src/init";
import { initTasks } from "./src/init/tasks.ts";
import { initRunBooks } from "./src/init/runbooks.ts";
import type { RunBook } from "./src/books/run-book.ts";

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  type?: never;
};

const tasks = initTasks(dependencies);
const books = initRunBooks(dependencies, tasks);

const book = (await search<RunBook>({
  message: "Which run book do you want to run?",
  source: (
    input: string | undefined,
  ): Choice<RunBook>[] | Promise<Choice<RunBook>[]> => {
    return books
      .filter((b) => b.name.toLowerCase().includes((input ?? "").toLowerCase()))
      .map((b) => ({
        name: b.name,
        value: b,
        description: b.desc,
      }));
  },
})) as RunBook;

try {
  await book.Run();
} catch (e: any) {
  if (e != null) {
    if (e.exitCode) {
      console.log(`❌ Error running book, exit code: ${e.exitCode}`);
      console.log("========= stderr start ==========");
      console.log(e.stderr.toString());
      console.log("========= stderr end ==========");
      console.log(
        Bun.inspect(e, {
          colors: true,
        }),
      );
    } else {
      throw e;
    }
  }
}
