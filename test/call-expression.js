import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates CallExpression', () => {
  expect(new Sandbox(parse('test()'), {test: () => 69}).next().value)
    .to.deep.include({value: 69});
});
