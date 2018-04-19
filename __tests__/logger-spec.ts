import { Logger } from '../src/logger';

const logger = new Logger({});
const colorLogger = new Logger({
  console: {
    colors: true
  }
});

const levelLogger = new Logger({
  files: {
    level: 'warn'
  },
  console: {
    level: 'error',
  }
});


const levelLogger1 = new Logger({
  files: {
    level: 'info'
  },
  console: {
    level: 'error',
  }
});

const levelLogger2 = new Logger({
  files: {
    level: 'error'
  },
  console: {
    level: 'info',
  }
});

const levelLogger3 = new Logger({
  files: {
    level: 'error'
  },
  console: {
    level: 'error',
  }
});

test('Should greet with message', () => {
  expect(logger).toBeTruthy();
});

test('Should be able to start', (done) => {
  logger.start(() => {
    done();
  });
});

test('Should be able to start without callback', () => {
  logger.start();
});

test('Should be able to append data', () => {
  logger.append('info', 'start', 'heoo', ['soso']);
});

test('Should be able to append data with colors', () => {
  colorLogger.append('info', 'start', 'heoo', null);
});


test('Should be able to stop', () => {
  logger.stop();
});

test('Should be able to flush data', async () => {
  levelLogger.append('info', 'start', '', ['soso']);
  levelLogger1.append('warn', 'start', '', ['soso']);
  levelLogger2.append('warn', 'start', '', ['soso']);
  levelLogger3.append('warn', 'start', '', ['soso']);
  levelLogger3.append('error', 'start', '', ['soso']);
  await levelLogger.flush();
  await levelLogger.flush();
  colorLogger.append('info', 'start', 'heoo', ['soso']);
  await colorLogger.flush();
});


test('Should be able to create dir and remove dir', () => {

  let dirLogger = new Logger({
    files: {
      directory: 'logs1'
    }
  });
  let dirLogger1 = new Logger({
    files: {
      directory: 'logs1'
    }
  });

  try {
    let dirLogger2 = new Logger({
      files: {
        directory: '/logger'
      }
    });
  } catch (e) {
    expect(e).toBeTruthy();
  }

  dirLogger.removeDir();
  colorLogger.removeDir();
});



