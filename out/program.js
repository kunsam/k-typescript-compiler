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
}
exports.default = Program;
