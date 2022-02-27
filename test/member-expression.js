import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates MemberExpression', () => {
  expect(new Sandbox(parse('a.b.c'), {a: {b: {c: 69}}}).next().value)
    .to.deep.include({value: 69});
});

it('evaluates async MemberExpression', async () => {
  const o = {allowAwaitOutsideFunction: true};
  const sandbox = new Sandbox(parse('const aa = await a; aa.b.c', o), {a: {b: {c: 69}}});
  let {async, value} = sandbox.next().value;
  expect(async)
    .to.be.true;
  expect(await value)
    .to.equal(undefined);
  ({async, value} = sandbox.next().value);
  expect(async)
    .to.be.undefined;
  expect(value)
    .to.equal(69);
});
