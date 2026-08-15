import { TokenFile } from './token.model';

export interface TokenStateMemento {
  files: TokenFile[];
  selectedVariants: Record<string, string>;
  disabledFileNames: string[];
}

export interface Command {
  execute(): void;
  undo(): void;
}
