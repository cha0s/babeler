import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates async ObjectExpression', async () => {
  const context = {
    b: () => Promise.resolve(2),
  };
  const o = {allowAwaitOutsideFunction: true};
  const sandbox = new Sandbox(parse('({a: 1, b: await b()})', o), context);
  const {async, value} = sandbox.next().value;
  expect(async).to.be.true;
  expect(await value)
    .to.deep.include({a: 1, b: 2});
});

it('evaluates ObjectExpression', () => {
  expect(new Sandbox(parse('({a: 1, b: 2})')).next().value)
    .to.deep.include({value: {a: 1, b: 2}});
  expect(new Sandbox(parse('({"a": 1, "b": 2})')).next().value)
    .to.deep.include({value: {a: 1, b: 2}});
});

it('evaluates async SpreadElement', async () => {
  const context = {
    b: () => Promise.resolve({a: 2}),
  };
  const o = {allowAwaitOutsideFunction: true};
  const sandbox = new Sandbox(parse('({a: 1, ...(await b())})', o), context);
  const {async, value} = sandbox.next().value;
  expect(async).to.be.true;
  expect(await value)
    .to.deep.include({a: 2});
});

it('evaluates SpreadElement', () => {
  expect(new Sandbox(parse('({...({a: 1}), a: 2})')).next().value)
    .to.deep.include({value: {a: 2}});
  expect(new Sandbox(parse('({a: 0, ...({a: 1})})')).next().value)
    .to.deep.include({value: {a: 1}});
});
