import * as path from "path";
import gql from "graphql-tag";
import * as ts from "typescript";
import { KTsCompiler } from "./typings";
import TsSyntaxResolveUtil from "./syntax_util";

export default class SourceFileUtil {
  public static getSyntaxKindByString(name: string): ts.SyntaxKind {
    switch (name) {
      case "ExportAssignment": {
        return ts.SyntaxKind.ExportAssignment;
      }
      case "LastLiteralToken": {
        return ts.SyntaxKind.LastLiteralToken;
      }
      case "PropertyDeclaration": {
        return ts.SyntaxKind.PropertyDeclaration;
      }
      case "VariableStatement": {
        return ts.SyntaxKind.VariableStatement;
      }
      case "VariableDeclarationList": {
        return ts.SyntaxKind.VariableDeclarationList;
      }
      case "VariableDeclaration": {
        return ts.SyntaxKind.VariableDeclaration;
      }
      case "Identifier": {
        return ts.SyntaxKind.Identifier;
      }
      case "NoSubstitutionTemplateLiteral": {
        return ts.SyntaxKind.NoSubstitutionTemplateLiteral;
      }
    }
  }

  public static recursiveGetSelectionResult(
    node: ts.Node,
    selections: any[] = []
  ) {
    if (!selections.length) return;
    let result: any;
    node.forEachChild(child => {
      selections.forEach(selection => {
        let currentResult: any;
        if (child.kind === this.getSyntaxKindByString(selection.name.value)) {
          const isDeepest = !(
            selection.selectionSet && selection.selectionSet.selections
          );
          if (isDeepest) {
            currentResult = { [selection.name.value]: child };
          } else {
            const childSelectionResult = this.recursiveGetSelectionResult(
              child,
              selection.selectionSet && selection.selectionSet.selections
            );
            if (childSelectionResult) {
              currentResult = { [selection.name.value]: childSelectionResult };
            }
          }
        }
        if (currentResult) {
          if (!result) result = {};
          result = { ...result, ...currentResult };
        }
      });
    });
    return result;
  }

  public static resolveChildNodeByQL(node: ts.Node, qlString: string) {
    const object = gql(qlString);
    if (object && object.definitions.length) {
      const _s = object.definitions[0].selectionSet.selections;
      return this.recursiveGetSelectionResult(node, _s);
    }
    return;
  }

  public static recursiveGetImportsNode(
    node: ts.Node,
    result: KTsCompiler.ImportFilesData[],
    sourceFile?: ts.SourceFile
  ) {
    node.getChildren().forEach((child, index) => {
      child.parent = node;
      if (ts.isImportClause(child)) {
        const names = TsSyntaxResolveUtil.resolveImportClause(
          child,
          [],
          sourceFile
        );
        const fromNode = node.getChildren()[index + 2];
        if (fromNode && fromNode.kind === ts.SyntaxKind.StringLiteral) {
          const importPath = fromNode.getText(sourceFile);
          // NOTICE 没有用相对路径的不作分析，需要推荐用相对路径
          if (/^(\'|\")(\.)+/.test(importPath)) {
            const fileName = node.getSourceFile().fileName;
            const absPath = path.join(
              fileName,
              "../",
              importPath.replace(/\'|\"/g, "")
            );
            // console.log(importPath, absPath, names, "fromNode names\n");
            result.push({ names, path: absPath });
          }
        }
      }
    });
  }

  public static getImportFilePaths(
    sourceFile: ts.SourceFile
  ): KTsCompiler.ImportFilesData[] {
    let importFilePaths: KTsCompiler.ImportFilesData[] = [];
    sourceFile.forEachChild(child => {
      child.parent = sourceFile;
      SourceFileUtil.recursiveGetImportsNode(
        child,
        importFilePaths,
        sourceFile
      );
    });
    return importFilePaths;
  }
}
