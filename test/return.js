import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates ReturnStatement', async () => {
  const o = {allowReturnOutsideFunction: true};
  const sandbox = new Sandbox(parse('return 69', o));
  const {done, value} = sandbox.next();
  expect(done)
    .to.be.true;
  expect(value.value)
    .to.deep.equal(69);
});
