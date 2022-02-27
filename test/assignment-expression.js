import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates async AssignmentExpression', async () => {
  const o = {allowAwaitOutsideFunction: true};
  const sandbox = new Sandbox(parse('let foo = await 69; foo + 351', o));
  const {async, value} = sandbox.next().value;
  expect(async)
    .to.be.true;
  await value;
  expect(sandbox.next().value)
    .to.deep.include({value: 420});
});

it('evaluates AssignmentExpression', () => {
  expect(new Sandbox(parse('let foo = 69; foo + 351')).next().value)
    .to.deep.include({value: 420});
});

it('destructures', () => {
  const sandbox = new Sandbox(parse('const {a, b} = {a: 1, b: 2}; [a, b];'));
  expect(sandbox.next().value)
    .to.deep.include({value: [1, 2]});
});

it('destructures async key', async () => {
  const o = {allowAwaitOutsideFunction: true};
  const sandbox = new Sandbox(parse('const k = "a"; const {[await k]: a, b} = {a: 1, b: 2}; [a, b];', o));
  const {async, value} = sandbox.next().value;
  expect(async)
    .to.be.true;
  await value;
  expect(sandbox.next().value)
    .to.deep.include({value: [1, 2]});
});

it('destructures async value', async () => {
  const o = {allowAwaitOutsideFunction: true};
  const sandbox = new Sandbox(parse('const {a, b} = await {a: 1, b: 2}; [a, b];', o));
  const {async, value} = sandbox.next().value;
  expect(async)
    .to.be.true;
  await value;
  expect(sandbox.next().value)
    .to.deep.include({value: [1, 2]});
});

it('nested destructures', () => {
  const sandbox = new Sandbox(parse('const {a, b: {c}} = {a: 1, b: {c: 2}}; [a, c];'));
  expect(sandbox.next().value)
    .to.deep.include({value: [1, 2]});
});
