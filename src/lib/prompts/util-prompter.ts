import { select } from '@inquirer/prompts';

class UtilPrompter {
  async YesNo(question: string): Promise<boolean> {
    const cont = (await select<boolean>({
      message: question,
      choices: [
        { name: 'Yes', value: true },
        { name: 'No', value: false },
      ],
    })) as boolean;
    return cont;
  }

  async YesNoExit(question: string): Promise<boolean | 'exit'> {
    const cont = (await select<boolean | 'exit'>({
      message: question,
      choices: [
        { name: 'Yes', value: true },
        { name: 'No', value: false },
        { name: 'Exit', value: 'exit' },
      ],
    })) as boolean | 'exit';
    return cont;
  }
}

export { UtilPrompter };
