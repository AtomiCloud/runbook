import { $ } from 'bun';

class Git {
  async CommitAndPush(dir: string, message: string): Promise<void> {
    await $`git pull`.cwd(dir);
    await $`git add .`.cwd(dir);
    await $`git commit -m "${message}"`.cwd(dir);
    await $`git push`.cwd(dir);
  }
}

export { Git };
