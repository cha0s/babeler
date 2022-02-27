import * as types from '@babel/types';

import Scope from './scope';

export default class Sandbox {

  constructor(ast, context) {
    this.ast = ast;
    this.parents = new WeakMap();
    this.scopes = new WeakMap();
    this.context = context;
    this.reset();
  }

  get context() {
    return this.rootScope?.context || {};
  }

  set context(context) {
    const {rootScope} = this;
    if (rootScope) {
      rootScope.context = context;
    }
    else {
      this.setNodeScope(this.ast, new Scope(context));
    }
  }

  destructureArray(id, init, scope) {
    this.setNextScope(id, scope);
    const {elements} = id;
    for (let i = 0; i < elements.length; ++i) {
      const element = elements[i];
      if (null === element) {
        // eslint-disable-next-line no-continue
        continue;
      }
      this.setNextScope(element, scope);
      if (types.isIdentifier(element)) {
        scope.allocate(element.name, init[i]);
      }
      else {
        // eslint-disable-next-line no-console
        console.error("destructureArray(): Can't handle type", element.type);
        return undefined;
      }
    }
    return undefined;
  }

  destructureObject(id, init, scope) {
    this.setNextScope(id, scope);
    const {properties} = id;
    const promises = [];
    for (let i = 0; i < properties.length; ++i) {
      const property = properties[i];
      this.setNextScope(property, scope);
      const k = property.computed ? this.evaluate(property.key) : {value: property.key.name};
      if (k.async) {
        promises.push(Promise.resolve(k.value).then((k) => {
          if (types.isIdentifier(property.value)) {
            const {name} = property.value;
            scope.allocate(name, init[k]);
            return undefined;
          }
          return this.destructureObject(property.value, init[k], scope);
        }));
        // eslint-disable-next-line no-continue
        continue;
      }
      if (types.isIdentifier(property.value)) {
        scope.allocate(property.value.name, init[k.value]);
      }
      else {
        const promiseOrVoid = this.destructureObject(property.value, init[k.value], scope);
        if (promiseOrVoid) {
          promises.push(promiseOrVoid);
        }
      }
    }
    return promises.length > 0 ? Promise.all(promises) : undefined;
  }

  evaluate(node) {
    this.setNextScope(node);
    const {type} = node;
    let evaluator = `evaluate${type}`;
    if (!this[evaluator]) {
      const keys = types.ALIAS_KEYS[type];
      for (let i = keys.length - 1; i >= 0; --i) {
        // eslint-disable-next-line no-cond-assign
        if (this[evaluator = `evaluate${keys[i]}`]) {
          break;
        }
      }
    }
    return this[evaluator]
      ? this[evaluator](node)
      // eslint-disable-next-line no-console
      : console.error("evaluate(): Can't handle", node.type);
  }

  evaluateArrayExpression(node) {
    const elements = [];
    let isAsync = false;
    for (let i = 0; i < node.elements.length; i++) {
      const {async, value} = this.evaluate(node.elements[i]);
      // eslint-disable-next-line no-bitwise
      isAsync |= async;
      elements.push(value);
    }
    return {
      async: !!isAsync,
      value: isAsync ? Promise.all(elements) : elements,
    };
  }

  evaluateAssignmentExpression(node) {
    const {operator, left} = node;
    const scope = this.nodeScope(node);
    const right = this.evaluate(node.right);
    if (!types.isMemberExpression(left)) {
      const assign = (value) => {
        switch (operator) {
          /* eslint-disable no-multi-spaces, switch-colon-spacing */
          case '='   : return scope.set(left.name, value);
          case '+='  : return scope.set(left.name, scope.get(left.name) +  value);
          case '-='  : return scope.set(left.name, scope.get(left.name) -  value);
          case '*='  : return scope.set(left.name, scope.get(left.name) *  value);
          case '/='  : return scope.set(left.name, scope.get(left.name) /  value);
          case '%='  : return scope.set(left.name, scope.get(left.name) %  value);
          case '**=' : return scope.set(left.name, scope.get(left.name) ** value);
          /* eslint-disable no-bitwise */
          case '<<=' : return scope.set(left.name, scope.get(left.name) <<  value);
          case '>>=' : return scope.set(left.name, scope.get(left.name) >>  value);
          case '>>>=': return scope.set(left.name, scope.get(left.name) >>> value);
          case '|='  : return scope.set(left.name, scope.get(left.name) |   value);
          case '^='  : return scope.set(left.name, scope.get(left.name) ^   value);
          case '&='  : return scope.set(left.name, scope.get(left.name) &   value);
          /* eslint-enable no-bitwise, no-multi-spaces */
          case '||=' : return scope.set(left.name, scope.get(left.name) || value);
          case '&&=' : return scope.set(left.name, scope.get(left.name) && value);
          case '??=' : {
          /* eslint-enable switch-colon-spacing */
            const l = scope.get(left.name);
            return scope.set(left.name, (l === null || l === undefined) ? value : l);
          }
          default:
            // eslint-disable-next-line no-console
            console.error("evaluateAssignmentExpression(): Can't handle operator", node.operator);
            return undefined;
        }
      };
      if (right.async) {
        return {
          async: true,
          value: Promise.resolve(right.value).then(assign),
        };
      }
      return {value: assign(right.value)};
    }
    const {
      computed,
      object,
      optional,
      property,
    } = left;
    const memberAssign = (O, P, value) => {
      if (optional && !O) {
        return undefined;
      }
      switch (operator) {
        // eslint-disable-next-line max-len
        /* eslint-disable no-param-reassign, no-return-assign, no-multi-spaces, switch-colon-spacing */
        case '='   : return O[P] =   value;
        case '+='  : return O[P] +=  value;
        case '-='  : return O[P] -=  value;
        case '*='  : return O[P] *=  value;
        case '/='  : return O[P] /=  value;
        case '%='  : return O[P] %=  value;
        case '**=' : return O[P] **= value;
        /* eslint-disable no-bitwise */
        case '<<=' : return O[P] <<=  value;
        case '>>=' : return O[P] >>=  value;
        case '>>>=': return O[P] >>>= value;
        case '|='  : return O[P] |=   value;
        case '^='  : return O[P] ^=   value;
        case '&='  : return O[P] &=   value;
        /* eslint-enable no-bitwise */
        case '||=' : return O[P] ||= value;
        case '&&=' : return O[P] &&= value;
        case '??=' : {
          return O[P] = (O[P] === null || O[P] === undefined) ? value : O[P];
        /* eslint-enable no-param-reassign, no-return-assign */
        }
        default:
          // eslint-disable-next-line no-console
          console.error("evaluateAssignmentExpression(): Can't handle operator", node.operator);
          return undefined;
      }
    };
    const makeAsync = (O, P, value) => (
      Promise.all([O, P, value]).then(([O, P, value]) => memberAssign(O, P, value))
    );
    const O = this.evaluate(object);
    const P = computed ? this.evaluate(property) : {value: property.name};
    // eslint-disable-next-line no-bitwise
    if (right.async | O.async | P.async) {
      return {
        async: true,
        value: makeAsync(O.value, P.value, right.value),
      };
    }
    return {value: memberAssign(O.value, P.value, right.value)};
  }

  evaluateAwaitExpression({argument}) {
    const {value} = this.evaluate(argument);
    return {
      async: true,
      value: value instanceof Promise ? value : Promise.resolve(value),
    };
  }

  evaluateBinaryExpression(node) {
    const binary = (left, right) => {
      switch (node.operator) {
        /* eslint-disable no-multi-spaces, switch-colon-spacing */
        case '+'  : return left +   right;
        case '-'  : return left -   right;
        case '/'  : return left /   right;
        case '%'  : return left %   right;
        case '*'  : return left *   right;
        case '>'  : return left >   right;
        case '<'  : return left <   right;
        case 'in' : return left in  right;
        case '>=' : return left >=  right;
        case '<=' : return left <=  right;
        case '**' : return left **  right;
        case '===': return left === right;
        case '!==': return left !== right;
        /* eslint-disable no-bitwise */
        case '^'  : return left ^   right;
        case '&'  : return left &   right;
        case '|'  : return left |   right;
        case '>>' : return left >>  right;
        case '<<' : return left <<  right;
        case '>>>': return left >>> right;
        /* eslint-enable no-bitwise */
        /* eslint-disable eqeqeq */
        case '==' : return left ==  right;
        case '!=' : return left !=  right;
        /* eslint-enable eqeqeq, no-multi-spaces, switch-colon-spacing */
        case 'instanceof': return left instanceof right;
        default:
          // eslint-disable-next-line no-console
          console.error("evaluateBinaryExpression(): Can't handle operator", node.operator);
          return undefined;
      }
    };
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);
    if (left.async || right.async) {
      return {
        async: true,
        value: Promise
          .all([left.value, right.value])
          .then(([left, right]) => binary(left, right)),
      };
    }
    return {value: binary(left.value, right.value)};
  }

  evaluateCallExpression(node) {
    let asyncArgs = false;
    const args = [];
    for (let i = 0; i < node.arguments.length; i++) {
      const arg = node.arguments[i];
      this.setNodeScope(arg, this.nodeScope(node));
      const {async, value} = this.evaluate(arg);
      // eslint-disable-next-line no-bitwise
      asyncArgs |= async;
      args.push(value);
    }
    const {callee, optional: callOptional} = node;
    /* eslint-disable switch-colon-spacing */
    const invoke = (fn, holder, args) => {
      if (callOptional && !fn) {
        return undefined;
      }
      return this.constructor.fastCall(fn, holder, args);
    };
    /* eslint-enable switch-colon-spacing */
    if (!types.isMemberExpression(callee)) {
      const {async, value} = this.evaluate(callee);
      if (asyncArgs || async) {
        return {
          async: true,
          value: Promise
            .all([value, Promise.all(args)])
            .then(([callee, args]) => invoke(callee, undefined, args)),
        };
      }
      return {value: invoke(value, undefined, args)};
    }
    const {
      computed,
      object,
      optional: memberOptional,
      property,
    } = callee;
    this.setNextScope(callee);
    const O = this.evaluate(object);
    const P = computed ? this.evaluate(property) : {value: property.name};
    if (asyncArgs || O.async || P.async) {
      return {
        async: true,
        value: Promise
          .all([O.value, P.value, Promise.all(args)])
          .then(([O, P, args]) => invoke(memberOptional ? O?.[P] : O[P], O, args)),
      };
    }
    return {value: invoke(memberOptional ? O.value?.[P.value] : O.value[P.value], O.value, args)};
  }

  evaluateConditionalExpression(node) {
    const test = this.evaluate(node.test);
    if (test.async) {
      return {
        async: true,
        value: Promise.resolve(test.value)
          .then((test) => this.evaluate(test ? node.consequent : node.alternate).value),
      };
    }
    return this.evaluate(test.value ? node.consequent : node.alternate);
  }

  // eslint-disable-next-line class-methods-use-this
  evaluateDirectiveLiteral({value}) {
    return {value};
  }

  evaluateIdentifier(node) {
    const scope = this.nodeScope(node);
    return {value: scope.get(node.name)};
  }

  // eslint-disable-next-line class-methods-use-this
  evaluateLiteral({value}) {
    return {value};
  }

  evaluateLogicalExpression(node) {
    const logic = (left, right) => {
      switch (node.operator) {
        case '||': return left || right;
        case '&&': return left && right;
        case '??': return (left === null || left === undefined) ? right : left;
        default:
          // eslint-disable-next-line no-console
          console.error("evaluateLogicalExpression(): Can't handle operator", node.operator);
          return undefined;
      }
    };
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);
    if (left.async || right.async) {
      return {
        async: true,
        value: Promise
          .all([left.value, right.value])
          .then(([left, right]) => logic(left, right)),
      };
    }
    return {value: logic(left.value, right.value)};
  }

  evaluateMemberExpression({
    computed,
    object,
    optional,
    property,
  }) {
    const member = (O, P) => (optional ? O?.[P] : O[P]);
    const O = this.evaluate(object);
    const P = computed ? this.evaluate(property) : {value: property.name};
    if (O.async || P.async) {
      return {
        async: true,
        value: Promise.all([O.value, P.value]).then(([O, P]) => member(O, P)),
      };
    }
    return {value: member(O.value, P.value)};
  }

  evaluateObjectExpression(node) {
    const {properties} = node;
    let isAsync = false;
    const entries = [];
    for (let i = 0; i < properties.length; i++) {
      if (types.isObjectProperty(properties[i])) {
        this.setNodeScope(properties[i], this.nodeScope(node));
        this.setNextScope(properties[i]);
        const {computed, key, value} = properties[i];
        let k;
        if (computed) {
          k = this.evaluate(key);
        }
        else if (types.isIdentifier(key)) {
          k = {value: key.name};
        }
        else if (types.isStringLiteral(key)) {
          k = {value: key.value};
        }
        else {
          // eslint-disable-next-line no-console
          console.error("evaluateObjectExpression(): Can't handle key type", key.type);
          k = {value: undefined};
        }
        const v = this.evaluate(value);
        // eslint-disable-next-line no-bitwise
        isAsync |= k.async | v.async;
        if (k.async || v.async) {
          entries.push(Promise.all([k.value, v.value]));
        }
        else {
          entries.push([k.value, v.value]);
        }
      }
      if (types.isSpreadElement(properties[i])) {
        const {argument} = properties[i];
        const spreading = this.evaluate(argument);
        // eslint-disable-next-line no-bitwise
        isAsync |= spreading.async;
        if (spreading.async) {
          entries.push(Promise.resolve(spreading.value).then((spreading) => {
            const entries = [];
            const keys = Object.keys(spreading);
            for (let i = 0; i < keys.length; ++i) {
              const key = keys[i];
              entries.push([key, spreading[key]]);
            }
            return entries;
          }));
        }
        else {
          const keys = Object.keys(spreading.value);
          for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            entries.push([key, spreading.value[key]]);
          }
        }
      }
    }
    return {
      async: !!isAsync,
      value: isAsync
        ? Promise.all(entries)
          .then((entries) => {
            const flat = [];
            for (let i = 0; i < entries.length; ++i) {
              const entry = entries[i];
              if (Array.isArray(entry[0])) {
                for (let j = 0; j < entry.length; j++) {
                  flat.push(entry[j]);
                }
              }
              else {
                flat.push(entry);
              }
            }
            return Object.fromEntries(flat);
          })
        : Object.fromEntries(entries),
    };
  }

  evaluateUnaryExpression(node) {
    const unary = (arg) => {
      switch (node.operator) {
        /* eslint-disable no-multi-spaces, switch-colon-spacing */
        case '+'     : return +arg;
        case '-'     : return -arg;
        case '!'     : return !arg;
        // eslint-disable-next-line no-bitwise
        case '~'     : return ~arg;
        case 'typeof': return typeof arg;
        // eslint-disable-next-line no-void
        case 'void'  : return undefined;
        // case 'delete': ...
        case 'throw' : throw arg;
        /* no-multi-spaces, switch-colon-spacing */
        default:
          // eslint-disable-next-line no-console
          console.error("evaluateUnaryExpression(): Can't handle operator", node.operator);
          return undefined;
      }
    };
    const arg = this.evaluate(node.argument);
    if (arg.async) {
      return {
        async: true,
        value: Promise.resolve(arg.value).then(unary),
      };
    }
    return {value: unary(arg.value)};
  }

  evaluateUpdateExpression(node) {
    const {argument, operator, prefix} = node;
    const {async, value} = this.evaluate(argument);
    const scope = this.nodeScope(node);
    const update = (value) => {
      if (prefix) {
        switch (operator) {
          case '++': return scope.set(argument.name, value + 1);
          case '--': return scope.set(argument.name, value - 1);
          default:
        }
      }
      switch (operator) {
        case '++':
          scope.set(argument.name, value + 1);
          return value;
        case '--':
          scope.set(argument.name, value - 1);
          return value;
        default:
      }
      // eslint-disable-next-line no-console
      console.error("evaluateUpdateExpression(): Can't handle", operator);
      return undefined;
    };
    if (async) {
      return {
        async: true,
        value: Promise.resolve(value).then((value) => update(value)),
      };
    }
    return {value: update(value)};
  }

  static fastCall(fn, holder, args) {
    if (holder) {
      const {name} = fn;
      if (name in holder && holder[name] === fn) {
        switch (args.length) {
          case 0 : return holder[name]();
          case 1 : return holder[name](args[0]);
          case 2 : return holder[name](args[0], args[1]);
          case 3 : return holder[name](args[0], args[1], args[2]);
          case 4 : return holder[name](args[0], args[1], args[2], args[3]);
          case 5 : return holder[name](args[0], args[1], args[2], args[3], args[4]);
          default: return holder[name](...args);
        }
      }
      const bound = fn.bind(holder);
      switch (args.length) {
        case 0 : return bound();
        case 1 : return bound(args[0]);
        case 2 : return bound(args[0], args[1]);
        case 3 : return bound(args[0], args[1], args[2]);
        case 4 : return bound(args[0], args[1], args[2], args[3]);
        case 5 : return bound(args[0], args[1], args[2], args[3], args[4]);
        default: return bound(...args);
      }
    }
    switch (args.length) {
      case 0 : return fn();
      case 1 : return fn(args[0]);
      case 2 : return fn(args[0], args[1]);
      case 3 : return fn(args[0], args[1], args[2]);
      case 4 : return fn(args[0], args[1], args[2], args[3]);
      case 5 : return fn(args[0], args[1], args[2], args[3], args[4]);
      default: return fn(...args);
    }
  }

  next() {
    return this.runner.next();
  }

  nextNodes(node, keys) {
    if (!keys) {
      return [];
    }
    const nodes = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const subNode = node[key];
      if (Array.isArray(subNode)) {
        for (let i = 0; i < subNode.length; i++) {
          const child = subNode[i];
          if (child) {
            this.setNodeParent(child, node);
            nodes.push(child);
          }
        }
      }
      else if (subNode) {
        this.setNodeParent(subNode, node);
        nodes.push(subNode);
      }
    }
    return nodes;
  }

  nodeParent(node) {
    return this.parents.get(node);
  }

  nodeScope(node) {
    return this.scopes.get(node);
  }

  reset() {
    const self = this;
    const {context} = this;
    this.parents = new WeakMap();
    this.scopes = new WeakMap();
    this.context = context;
    this.runner = (function* traverse() {
      return yield* self.traverse(self.ast);
    }());
    return this;
  }

  get rootScope() {
    return this.nodeScope(this.ast);
  }

  async run(max = 10000) {
    for (
      let {done, value: {async, value}} = this.runner.next();
      // eslint-disable-next-line no-param-reassign
      --max > 0
      && done !== true
      && async
      // eslint-disable-next-line no-await-in-loop
      && await value;
      {done, value: {async, value}} = this.runner.next()
    // eslint-disable-next-line no-empty
    ) {}
    return this;
  }

  setNextScope(node, scope = this.nodeScope(node)) {
    const nodes = this.nextNodes(node, types.VISITOR_KEYS[node.type]);
    for (let i = 0; i < nodes.length; i++) {
      this.setNodeScope(nodes[i], scope);
    }
  }

  setNodeParent(node, parent) {
    this.parents.set(node, parent);
  }

  setNodeScope(node, scope) {
    this.scopes.set(node, scope);
  }

  * traverse(node) {
    let keys = types.VISITOR_KEYS[node.type];
    if (!keys) {
      return;
    }
    // Scope...
    let scope = this.nodeScope(node);
    if (types.isBlockStatement(node)) {
      scope = scope.push();
    }
    if (types.isForStatement(node)) {
      scope = scope.push();
    }
    this.setNextScope(node, scope);
    if (types.isVariableDeclarator(node)) {
      const {id} = node;
      const init = this.evaluate(node.init);
      if (types.isIdentifier(id)) {
        if (init.async) {
          yield {
            async: true,
            value: Promise.resolve(init.value).then((value) => {
              scope.allocate(id.name, value);
            }),
          };
        }
        else {
          scope.allocate(id.name, init.value);
        }
      }
      else if (types.isArrayPattern(id)) {
        const promiseOrVoid = init.async
          ? Promise.resolve(init.value).then((init) => this.destructureArray(id, init, scope))
          : this.destructureArray(id, init.value, scope);
        if (promiseOrVoid) {
          yield {
            async: true,
            value: promiseOrVoid,
          };
        }
      }
      else if (types.isObjectPattern(id)) {
        const promiseOrVoid = init.async
          ? Promise.resolve(init.value).then((init) => this.destructureObject(id, init, scope))
          : this.destructureObject(id, init.value, scope);
        if (promiseOrVoid) {
          yield {
            async: true,
            value: promiseOrVoid,
          };
        }
      }
    }
    // Blocks...
    if (types.isIfStatement(node)) {
      const {async, value} = this.evaluate(node.test);
      const branch = (value) => {
        keys = [value ? 'consequent' : 'alternate'];
      };
      if (async) {
        yield {
          async: true,
          value: Promise.resolve(value).then(branch),
        };
      }
      else {
        branch(value);
      }
    }
    // Loops...
    let loop = false;
    if (types.isForStatement(node)) {
      const {value} = this.traverse(node.init).next();
      if (value?.async) {
        yield value;
      }
    }
    do {
      if (
        types.isForStatement(node)
        || types.isWhileStatement(node)
      ) {
        const {async, value} = this.evaluate(node.test);
        if (async) {
          yield {
            async: true,
            // eslint-disable-next-line no-loop-func
            value: Promise.resolve(value).then((value) => {
              keys = value ? ['body'] : [];
            }),
          };
        }
        else {
          keys = value ? ['body'] : [];
        }
        loop = keys.length > 0;
      }
      // Recur...
      const nodes = this.nextNodes(node, keys);
      for (let i = 0; i < nodes.length; i++) {
        const r = yield* this.traverse(nodes[i]);
        if (r) {
          // eslint-disable-next-line consistent-return
          return r;
        }
      }
      // Loops...
      if (types.isForStatement(node)) {
        const {value} = this.traverse(node.update).next();
        if (value?.async) {
          yield value;
        }
        if (loop) {
          yield {loop: 'for', value: undefined};
        }
      }
      if (types.isDoWhileStatement(node)) {
        const test = this.evaluate(node.test);
        if (test.async) {
          yield {
            async: true,
            // eslint-disable-next-line no-loop-func
            value: Promise.resolve(test.value).then((value) => {
              loop = value;
            }),
          };
        }
        else {
          loop = test.value;
        }
        yield {loop: 'doWhile', value: undefined};
      }
      if (types.isWhileStatement(node) && loop) {
        yield {loop: 'while', value: undefined};
      }
    } while (loop);
    // Scope...
    if (types.isBlockStatement(node)) {
      scope = scope.pop();
    }
    if (types.isForStatement(node)) {
      scope = scope.pop();
    }
    // Evaluate...
    if (types.isReturnStatement(node)) {
      // eslint-disable-next-line consistent-return
      return !node.argument ? {value: undefined} : this.evaluate(node.argument);
    }
    if (types.isDirective(node)) {
      yield this.evaluate(node.value);
    }
    if (types.isExpressionStatement(node)) {
      yield this.evaluate(node.expression);
    }
    // Pass through ForStatement update expressions.
    if (types.isUpdateExpression(node) && types.isForStatement(this.nodeParent(node))) {
      yield this.evaluate(node);
    }
  }

}
