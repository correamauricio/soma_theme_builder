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
  value: any;
  resolvedValue: any;
  type: string;
  originalType?: string;
  description?: string;
  extensions?: any;
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

export interface GroupedTokenNode {
  _token?: FlatToken;
  [key: string]: GroupedTokenNode | any;
}
