export default class Scope {

  parent = null;

  context = {};

  constructor(context = {}) {
    this.context = context;
  }

  allocate(key, value) {
    this.context[key] = value;
  }

  get(key) {
    let walk = this;
    while (walk) {
      if (key in walk.context) {
        return walk.context[key];
      }
      walk = walk.parent;
    }
    return undefined;
  }

  pop() {
    const {parent} = this;
    this.parent = null;
    return parent;
  }

  push() {
    const scope = new Scope();
    scope.parent = this;
    return scope;
  }

  set(key, value) {
    let walk = this;
    // eslint-disable-next-line no-constant-condition
    while (walk) {
      if (key in walk.context) {
        walk.context[key] = value;
        return value;
      }
      // TODO: disallow global set?
      if (!walk.parent) {
        walk.context[key] = value;
        return value;
      }
      walk = walk.parent;
    }
    return undefined;
  }

}
