import * as ts from "typescript";
import SourceFileUtil from "./sourefile_util";

export default class Program {
  private _program: ts.Program;
  constructor(fileNames: string[], options: ts.CompilerOptions) {
    this._program = ts.createProgram(fileNames, options);
  }
  public get program() {
    return this._program;
  }

  public init() {
    // 可以计算sourceFile当中的数据 做缓存
  }

  public static getSourceFileByImportName(
    sourceFile: ts.SourceFile,
    sourceFiles: readonly ts.SourceFile[],
    importName: string
  ): ts.SourceFile | undefined {
    const filePaths = SourceFileUtil.getImportFilePaths(sourceFile);
    let _findSourceFile: ts.SourceFile | undefined;
    const _find = filePaths.find(p =>
      p.names.find(name => name === importName)
    );
    if (_find) {
      sourceFiles.every(sf => {
        if (/\.(jsx?|tsx?)/.test(sf.fileName)) {
          const array = sf.fileName.split(".");
          array.pop();
          const removeSuffixPath =
            array.length === 1 ? array[0] : array.join(".");
          if (removeSuffixPath === _find.path) {
            _findSourceFile = sf;
          }
        }
        return !_findSourceFile;
      });
    }
    return _findSourceFile;
  }
}
