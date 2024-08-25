interface RunBook {
  Run(): Promise<void>;
  name: string;
  desc: string;
}

export type { RunBook };
