import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates AwaitExpression', async () => {
  const context = {
    wait: () => new Promise((resolve) => setTimeout(() => resolve(420), 0)),
  };
  const o = {allowAwaitOutsideFunction: true};
  const sandbox = new Sandbox(parse('const test = await wait(); test', o), context);
  const {value} = sandbox.next();
  expect(value.async)
    .to.be.true;
  await value.value;
  expect(sandbox.next().value.value)
    .to.equal(420);
});
