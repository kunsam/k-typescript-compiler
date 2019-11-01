import * as ts from "typescript";
import { KTsCompiler } from "./typings";

export default class TsSyntaxResolveUtil {
  public static getNodeValue(node: ts.Node, sourceFile?: ts.SourceFile) {
    if (node.kind === ts.SyntaxKind.NumericLiteral) {
      return node.getText(sourceFile).includes(".")
        ? parseFloat(node.getText(sourceFile))
        : parseInt(node.getText(sourceFile));
    }
    if (node.kind === ts.SyntaxKind.StringLiteral) {
      return node.getText(sourceFile);
    }
    if (node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
      return this.resolveObjectLiteralExpressionToObject(
        node as ts.ObjectLiteralExpression,
        {},
        sourceFile
      );
    }
    if (node.kind === ts.SyntaxKind.ArrayLiteralExpression) {
      return this.resolveArrayLiteralExpressionToObject(
        node as ts.ArrayLiteralExpression,
        [],
        sourceFile
      );
    }
  }

  public static getNodeLocation(
    sourceFile: ts.SourceFile,
    node: ts.Node
  ): KTsCompiler.Location {
    // const start = sourceFile.getLineAndCharacterOfPosition(node.pos);
    const start = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile, true)
    );
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    const clocation: KTsCompiler.Location = {
      filePath: sourceFile.fileName,
      range: {
        start: {
          line: start.line + 1,
          character: start.character + 1
        },
        end: {
          line: end.line + 1, // 目前只用于一些ID 不换行
          character: end.character + 1 // + node.getText(sourceFile).length
        }
      }
    };
    return clocation;
  }

  public static resolveTypeReference(
    node: ts.TypeReferenceNode,
    sourceFile?: ts.SourceFile
  ) {
    if (!node.typeArguments) {
      return {};
    }
    const output = node.typeArguments.map(tnode => {
      tnode.parent = node;
      return this.resolveTypeNode(tnode, sourceFile);
    });
    return {
      [node.typeName.getText(sourceFile)]: output
    };
  }

  public static resolveTypeNode(node: ts.TypeNode, sourceFile?: ts.SourceFile) {
    let outPut;
    if (node.kind === ts.SyntaxKind.ArrayType) {
      outPut = [];
      node.forEachChild(child => {
        child.parent = node;
        if (ts.isTypeNode(child)) {
          outPut.push(this.resolveTypeNode(child, sourceFile));
        }
      });
      return outPut;
    }

    if (ts.isTypeLiteralNode(node)) {
      // console.log("\nresolveTypeNode", node.kind, node.getText());
      node.forEachChild(child => {
        child.parent = node;
        if (ts.isPropertySignature(child)) {
          outPut = {};
          const childChild0 = child.getChildAt(0);
          const childChild1 = child.getChildAt(1);
          const childChild2 = child.getChildAt(2);
          if (!childChild0 || !childChild1 || !childChild2) {
            return;
          }
          if (
            ts.isIdentifier(childChild0) &&
            childChild1.kind === ts.SyntaxKind.ColonToken
          ) {
            childChild2.parent = child;
            // any[] | { a: number }[] | {a: string, b: any[]}
            if (ts.isTypeNode(childChild2)) {
              outPut[childChild0.getText(sourceFile)] = this.resolveTypeNode(
                childChild2,
                sourceFile
              );
            }
          }
        }
      });
      return outPut;
    }

    // 	node.kind === ts.SyntaxKind.StringKeyword ||
    // 	node.kind === ts.SyntaxKind.NumberKeyword ||
    // 	node.kind === ts.SyntaxKind.NullKeyword ||
    // 	node.kind === ts.SyntaxKind.UndefinedKeyword ||
    // 	node.kind === ts.SyntaxKind.ObjectKeyword ||
    // 	node.kind === ts.SyntaxKind.BooleanKeyword ||
    // 	node.kind === ts.SyntaxKind.AnyKeyword

    return node.getText(sourceFile);
  }

  public static resolveObjectLiteralExpressionToObject(
    node: ts.ObjectLiteralExpression,
    result: any = {},
    sourceFile?: ts.SourceFile
  ) {
    const properties: ts.PropertyAssignment[] = node.properties.filter(
      p => p.kind === ts.SyntaxKind.PropertyAssignment
    ) as ts.PropertyAssignment[];
    properties.forEach(p => {
      result[p.name.getText(sourceFile)] = this.getNodeValue(
        p.initializer,
        sourceFile
      );
    });
    return result;
  }

  public static resolveArrayLiteralExpressionToObject(
    node: ts.ArrayLiteralExpression,
    result: any[] = [],
    sourceFile?: ts.SourceFile
  ) {
    node.forEachChild(child => {
      child.parent = node;
      result.push(this.getNodeValue(child, sourceFile));
    });
    return result;
  }

  public static resolveImportClause(
    node: ts.ImportClause,
    result: string[],
    sourceFile?: ts.SourceFile
  ): string[] {
    node.forEachChild(child => {
      child.parent = node;
      if (child.kind === ts.SyntaxKind.Identifier) {
        result.push(child.getText(sourceFile));
      }
      if (child.kind === ts.SyntaxKind.NamedImports) {
        child.forEachChild(cchild => {
          cchild.parent = child;
          if (cchild.kind === ts.SyntaxKind.ImportSpecifier) {
            result.push(cchild.getText(sourceFile));
          }
        });
      }
    });
    return result;
  }
  /**
   * 不支持Map等特殊数据结构
   *
   * @static
   * @param {ts.PropertyDeclaration} node
   * @returns
   * @memberof TsSyntaxResolveUtil
   */
  public static getPropertyDeclarationNodeValue(
    node: ts.PropertyDeclaration,
    sourceFile?: ts.SourceFile
  ) {
    let value: any;
    node.forEachChild(child => {
      if (value) return;
      child.parent = node;
      if (ts.isStringLiteral(child)) {
        value = child.getText(sourceFile);
      }
      if (ts.isNumericLiteral(child)) {
        value = child.getText(sourceFile).includes(".")
          ? parseFloat(child.getText(sourceFile))
          : parseInt(child.getText(sourceFile));
      }
      if (ts.isObjectLiteralExpression(child)) {
        value = this.resolveObjectLiteralExpressionToObject(
          child,
          {},
          sourceFile
        );
      }
      if (ts.isArrayLiteralExpression(child)) {
        value = this.resolveArrayLiteralExpressionToObject(
          child,
          [],
          sourceFile
        );
      }
    });
    let valueReference: string | undefined;
    if (!value) {
      let isIdentifierCount = 0;
      node.forEachChild(child => {
        if (ts.isIdentifier(child)) {
          isIdentifierCount++;
        }
        if (isIdentifierCount >= 2) {
          valueReference = child.getText(sourceFile);
        }
      });
    }
    return {
      value,
      valueReference
    };
  }

  public static getNodeChildKeywords(
    node: ts.Node,
    sourceFile?: ts.SourceFile
  ): string[] {
    let keywords = [];
    node.forEachChild(hc => {
      hc.parent = node;
      // 应该还有更多
      if (
        hc.kind === ts.SyntaxKind.PrivateKeyword ||
        hc.kind === ts.SyntaxKind.PublicKeyword ||
        hc.kind === ts.SyntaxKind.ProtectedKeyword ||
        hc.kind === ts.SyntaxKind.StaticKeyword
      ) {
        keywords.push(hc.getText(sourceFile));
      }
    });
    return keywords;
  }

  // 暂不支持复杂的type union
  public static getNodeChildType(node: ts.Node, sourceFile?: ts.SourceFile) {
    let type: { value: any; location: KTsCompiler.Location } | undefined;
    node.forEachChild(hc => {
      hc.parent = node;
      if (ts.isTypeNode(hc)) {
        if (ts.isTypeReferenceNode(hc)) {
          type = {
            value: this.resolveTypeReference(hc, sourceFile),
            location: this.getNodeLocation(sourceFile, hc)
          };
        } else {
          type = {
            value: this.resolveTypeNode(hc, sourceFile),
            location: this.getNodeLocation(sourceFile, hc)
          };
        }
      }
    });
    return type;
  }

  /**
   * 解析class
   *
   * @static
   * @param {ts.ClassDeclaration} node
   * @returns
   * @memberof TsSyntaxResolveUtil
   */
  public static resolveClassDeclaration(
    node: ts.ClassDeclaration,
    sourceFile: ts.SourceFile
  ): KTsCompiler.ClassData {
    let classObject: any = { propertys: [] };
    node.forEachChild(classChild => {
      // Location
      classChild.parent = node;
      if (ts.isIdentifier(classChild)) {
        classObject.name = classChild.getText(sourceFile);
        classObject.location = this.getNodeLocation(sourceFile, classChild);
      }
      if (ts.isHeritageClause(classChild)) {
        classChild.forEachChild(hc => {
          hc.parent = classChild;
          if (hc.kind === ts.SyntaxKind.ExpressionWithTypeArguments) {
            classObject.extend = { name: hc.getText(sourceFile) };
          }
        });
      }
      if (ts.isPropertyDeclaration(classChild)) {
        let property: any = {};
        const valueResult = TsSyntaxResolveUtil.getPropertyDeclarationNodeValue(
          classChild,
          sourceFile
        );
        property.value = valueResult.value;

        property.valueReference = valueResult.valueReference;

        property.keywords = TsSyntaxResolveUtil.getNodeChildKeywords(
          classChild,
          sourceFile
        );
        const type = TsSyntaxResolveUtil.getNodeChildType(
          classChild,
          sourceFile
        );
        property.type = type;

        // 可能有多个Identifier
        classChild.forEachChild(hc => {
          if (property.key) {
            return;
          }
          hc.parent = classChild;
          if (hc.kind === ts.SyntaxKind.Identifier) {
            property.key = hc.getText(sourceFile);
            property.location = this.getNodeLocation(sourceFile, classChild);
          }
        });
        classObject.propertys.push(property);
      }
      if (ts.isMethodDeclaration(classChild)) {
        let property: any = {};
        property.keywords = TsSyntaxResolveUtil.getNodeChildKeywords(
          classChild,
          sourceFile
        );
        classChild.forEachChild(hc => {
          hc.parent = classChild;
          if (hc.kind === ts.SyntaxKind.Identifier) {
            property.key = hc.getText(sourceFile);
          }
          if (hc.kind === ts.SyntaxKind.Block) {
            property.value = hc.getText(sourceFile);
          }
        });
        classObject.propertys.push(property);
      }
    });
    // console.log(node.getText(), classObject, "classObjec\n");
    return classObject;
  }
}
