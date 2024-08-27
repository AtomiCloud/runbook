import { $ } from 'bun';
class HttpUtil {
  async WaitFor(interval: number, url: string, method: string = 'GET'): Promise<void> {
    while (true) {
      const response = await fetch(url, { method });
      if (response.ok) return;
      await $`sleep ${interval}`;
    }
  }
}

export { HttpUtil };
