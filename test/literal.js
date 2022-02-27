import {parse} from '@babel/parser';
import {expect} from 'chai';

import Sandbox from '../src/sandbox';

it('evaluates Literal', () => {
  expect(new Sandbox(parse('69')).next().value)
    .to.deep.include({value: 69});
  expect(new Sandbox(parse('"420"')).next().value)
    .to.deep.include({value: '420'});
  expect(new Sandbox(parse('420.69')).next().value)
    .to.deep.include({value: 420.69});
});
