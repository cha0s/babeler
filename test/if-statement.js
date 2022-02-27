import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates IfStatement', () => {
  expect(new Sandbox(parse('if (false) { 69; }')).next())
    .to.deep.include({done: true});
  expect(new Sandbox(parse('if (true) { 69; }')).next().value)
    .to.deep.include({value: 69});
});
