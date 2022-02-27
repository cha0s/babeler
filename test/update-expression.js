import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates UpdateExpression', () => {
  expect(new Sandbox(parse('a++'), {a: 1}).next().value)
    .to.deep.include({value: 1});
  expect(new Sandbox(parse('++a'), {a: 1}).next().value)
    .to.deep.include({value: 2});
  expect(new Sandbox(parse('a--'), {a: 1}).next().value)
    .to.deep.include({value: 1});
  expect(new Sandbox(parse('--a'), {a: 1}).next().value)
    .to.deep.include({value: 0});
});
