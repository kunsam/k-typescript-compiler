import * as ts from "typescript";

export default class Program {
  private _program: ts.Program
  constructor(fileNames: string[],options: ts.CompilerOptions) {
    this._program = ts.createProgram(fileNames, options);

  }
  public get program() {
    return this._program
  }

}
