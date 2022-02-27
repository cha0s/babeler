import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates BinaryExpression', () => {
  expect(new Sandbox(parse('1 + 2')).next().value)
    .to.deep.include({value: 3});
  expect(new Sandbox(parse('1 - 2')).next().value)
    .to.deep.include({value: -1});
  expect(new Sandbox(parse('4 / 2')).next().value)
    .to.deep.include({value: 2});
  expect(new Sandbox(parse('10 % 3')).next().value)
    .to.deep.include({value: 1});
  expect(new Sandbox(parse('1 * 2')).next().value)
    .to.deep.include({value: 2});
  expect(new Sandbox(parse('1 > 2')).next().value)
    .to.deep.include({value: false});
  expect(new Sandbox(parse('1 < 2')).next().value)
    .to.deep.include({value: true});
  expect(new Sandbox(parse('const foo = {a: 69}; "a" in foo')).next().value)
    .to.deep.include({value: true});
  expect(new Sandbox(parse('const foo = {a: 69}; "b" in foo')).next().value)
    .to.deep.include({value: false});
  expect(new Sandbox(parse('1 >= 2')).next().value)
    .to.deep.include({value: false});
  expect(new Sandbox(parse('1 <= 2')).next().value)
    .to.deep.include({value: true});
  expect(new Sandbox(parse('2 ** 3')).next().value)
    .to.deep.include({value: 8});
  expect(new Sandbox(parse('1 === 2')).next().value)
    .to.deep.include({value: false});
  expect(new Sandbox(parse('1 !== 2')).next().value)
    .to.deep.include({value: true});
  expect(new Sandbox(parse('7 & 3')).next().value)
    .to.deep.include({value: 3});
  expect(new Sandbox(parse('1 | 2')).next().value)
    .to.deep.include({value: 3});
  expect(new Sandbox(parse('16 >> 2')).next().value)
    .to.deep.include({value: 4});
  expect(new Sandbox(parse('16 >>> 5')).next().value)
    .to.deep.include({value: 0});
  expect(new Sandbox(parse('1 << 2')).next().value)
    .to.deep.include({value: 4});
  expect(new Sandbox(parse('1 ^ 2')).next().value)
    .to.deep.include({value: 3});
  expect(new Sandbox(parse('1 == 2')).next().value)
    .to.deep.include({value: false});
  expect(new Sandbox(parse('1 != 2')).next().value)
    .to.deep.include({value: true});
});
