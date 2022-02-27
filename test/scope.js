import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('scopes BlockStatement', () => {
  const sandbox = new Sandbox(parse('if (true) { const foo = 69; foo; } foo;'));
  expect(sandbox.next().value)
    .to.deep.include({value: 69});
  expect(sandbox.next().value)
    .to.deep.include({value: undefined});
});

it('scopes ForStatement', () => {
  expect(new Sandbox(parse('for (let i = 0; i < 5; ++i) {} i;')).next().value)
    .to.deep.include({value: undefined});
});
