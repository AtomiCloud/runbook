import { parseDocument } from 'yaml';

class YamlManipulator {
  async Mutate(path: string, mutations: [string[], unknown][]): Promise<void> {
    const f = Bun.file(path);
    const y = await f.text();
    const values = parseDocument(y);
    for (const [path, value] of mutations) values.setIn(path, value);
    const options = { lineWidth: Infinity };
    const newYaml = values.toString(options);
    await Bun.write(path, newYaml);
  }
}

export { YamlManipulator };
