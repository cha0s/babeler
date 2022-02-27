import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates WhileStatement', () => {
  const sandbox = new Sandbox(parse('let i = 0; while (i < 5) { i++; }'));
  for (let i = 0; i < 5; ++i) {
    expect(sandbox.next().value).to.deep.include({value: i});
    // Loop...
    sandbox.next();
  }
});
