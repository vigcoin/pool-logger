import { Logger } from '../src/logger';

test('Should greet with message', () => {
  const logger = new Logger({});
  expect(logger).toBeTruthy();
});
