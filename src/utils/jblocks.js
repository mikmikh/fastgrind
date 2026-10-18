import * as jutils from "./utils.js";

export class JBlocks {
  constructor(atFn) {
    this.atFn = atFn;
    this.changes = {};
  }
  at(pos) {
    const key = jutils.jpos2key(pos);
    if (key in this.changes && this.changes[key] !== undefined) {
      
      return this.changes[key];
    }
    return this.atFn(pos);
  }
  set(pos, value) {
    const key = jutils.jpos2key(pos);
    this.changes[key] = value;
    if (value === undefined) {
      delete this.changes[key];
    }
  }
}
