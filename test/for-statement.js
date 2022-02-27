import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates ForStatement', () => {
  const sandbox = new Sandbox(parse('for (let i = 0; i < 5; ++i) { i; }'));
  for (let i = 0; i < 5; ++i) {
    expect(sandbox.next().value).to.deep.include({value: i});
    // Loop...
    sandbox.next();
  }
});
