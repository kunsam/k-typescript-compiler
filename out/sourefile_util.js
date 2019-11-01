"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const graphql_tag_1 = require("graphql-tag");
const ts = require("typescript");
const syntax_util_1 = require("./syntax_util");
class SourceFileUtil {
    static getSyntaxKindByString(name) {
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
    static recursiveGetSelectionResult(node, selections = []) {
        if (!selections.length)
            return;
        let result;
        node.forEachChild(child => {
            selections.forEach(selection => {
                let currentResult;
                if (child.kind === this.getSyntaxKindByString(selection.name.value)) {
                    const isDeepest = !(selection.selectionSet && selection.selectionSet.selections);
                    if (isDeepest) {
                        currentResult = { [selection.name.value]: child };
                    }
                    else {
                        const childSelectionResult = this.recursiveGetSelectionResult(child, selection.selectionSet && selection.selectionSet.selections);
                        if (childSelectionResult) {
                            currentResult = { [selection.name.value]: childSelectionResult };
                        }
                    }
                }
                if (currentResult) {
                    if (!result)
                        result = {};
                    result = Object.assign(Object.assign({}, result), currentResult);
                }
            });
        });
        return result;
    }
    static resolveChildNodeByQL(node, qlString) {
        const object = graphql_tag_1.default(qlString);
        if (object && object.definitions.length) {
            const _s = object.definitions[0].selectionSet.selections;
            return this.recursiveGetSelectionResult(node, _s);
        }
        return;
    }
    static recursiveGetImportsNode(node, result, sourceFile) {
        node.getChildren().forEach((child, index) => {
            child.parent = node;
            if (ts.isImportClause(child)) {
                const names = syntax_util_1.default.resolveImportClause(child, [], sourceFile);
                const fromNode = node.getChildren()[index + 2];
                if (fromNode && fromNode.kind === ts.SyntaxKind.StringLiteral) {
                    const importPath = fromNode.getText(sourceFile);
                    // NOTICE 没有用相对路径的不作分析，需要推荐用相对路径
                    if (/^(\'|\")(\.)+/.test(importPath)) {
                        const fileName = node.getSourceFile().fileName;
                        const absPath = path.join(fileName, "../", importPath.replace(/\'|\"/g, ""));
                        // console.log(importPath, absPath, names, "fromNode names\n");
                        result.push({ names, path: absPath });
                    }
                }
            }
        });
    }
    static getImportFilePaths(sourceFile) {
        let importFilePaths = [];
        sourceFile.forEachChild(child => {
            child.parent = sourceFile;
            SourceFileUtil.recursiveGetImportsNode(child, importFilePaths, sourceFile);
        });
        return importFilePaths;
    }
}
exports.default = SourceFileUtil;
//# sourceMappingURL=sourefile_util.js.map