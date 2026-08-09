export interface DesignToken {
  $value?: string | number;
  value?: string | number;
  $type?: string;
  type?: string;
  [key: string]: any;
}

export interface FlatToken {
  path: string;
  originalPath: string[];
  value: string;
  resolvedValue: string;
  type: string;
  sourceFile: string;
}

export interface TokenFile {
  name: string;
  content: any;
}

export interface VariantGroup {
  id: string;
  name: string;
  files: string[];
  activeFile: string;
}
