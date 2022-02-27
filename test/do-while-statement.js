import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates DoWhileStatement', () => {
  const sandbox = new Sandbox(parse('let i = 0; do { i++; } while (false); i'));
  expect(sandbox.next().value).to.deep.include({value: 0});
  expect(sandbox.next().value).to.deep.include({value: undefined});
  expect(sandbox.next().value).to.deep.include({value: 1});
});
