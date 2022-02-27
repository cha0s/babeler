import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('can update context', () => {
  const sandbox = new Sandbox(parse('foo = 420'), {foo: 69});
  expect(sandbox.context)
    .to.deep.equal({foo: 69});
  sandbox.run();
  expect(sandbox.context)
    .to.deep.equal({foo: 420});
});
