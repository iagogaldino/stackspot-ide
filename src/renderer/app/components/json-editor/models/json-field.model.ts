export interface JSONField {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  isSpecial?: 'scripts' | 'dependencies' | 'devDependencies';
  path: string; // Caminho no JSON (ex: "scripts.start")
}

