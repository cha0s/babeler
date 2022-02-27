import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates Identifier', () => {
  expect(new Sandbox(parse('const test = 69; test')).next().value)
    .to.deep.include({value: 69});
});
