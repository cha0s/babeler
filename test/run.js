import {parse} from '@babel/parser';

import Sandbox from '../src/sandbox';

it('runs', async () => {
  const context = {
    wait: () => new Promise((resolve) => setTimeout(() => resolve(), 0)),
  };
  const o = {allowAwaitOutsideFunction: true};
  const sandbox = new Sandbox(parse('await wait(); 1 + 3 * 2;', o), context);
  await sandbox.run();
});
