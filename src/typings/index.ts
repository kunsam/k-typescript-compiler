import * as ts from "typescript";

export namespace KTsCompiler {
  export type ImportFilesData = {
    path: string;
    names: string[];
  };

  export interface Location {
    filePath: string;
    range: {
      start: {
        line: number;
        character: number;
      };
      end: {
        line: number;
        character: number;
      };
    };
  }

  export interface ClassProperty {
    value: any;
    valueReference?: string; // 引用值
    key: string;
    keywords?: string[];
    kind: ts.SyntaxKind;
    location: Location;
    type?: {
      location: Location;
      value: string | { [key: string]: any } | any[];
    };
  }

  export interface ClassData {
    location: Location;
    extend: {
      name: string;
      // path
    };
    name: string;
    propertys: ClassProperty[];
  }
}
