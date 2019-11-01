"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
class Program {
    constructor(fileNames, options) {
        this._program = ts.createProgram(fileNames, options);
    }
    get program() {
        return this._program;
    }
    init() {
        // 可以计算sourceFile当中的数据 做缓存
    }
}
exports.default = Program;
