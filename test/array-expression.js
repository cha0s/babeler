import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates ArrayExpression', () => {
  expect(new Sandbox(parse('[1, 2, 3]')).next().value)
    .to.deep.include({value: [1, 2, 3]});
});

it('evaluates async ArrayExpression', async () => {
  const o = {allowAwaitOutsideFunction: true};
  const {async, value} = new Sandbox(parse('[await 1, 2, 3]', o)).next().value;
  expect(async)
    .to.be.true;
  expect(await value)
    .to.deep.equal([1, 2, 3]);
});
