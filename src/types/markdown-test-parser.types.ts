export interface CodeBlock {
  code: string;
  startLine: number;
  endLine: number;
}

export interface ParsedStep {
  title: string;
  description: string;
  code?: string;
  level: number;
}
