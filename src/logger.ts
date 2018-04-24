import * as clc from 'cli-color';
import * as dateformat from 'dateformat';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as rimraf from 'rimraf';
import { format, promisify } from 'util';

const log = console.log;

export class Logger {
  private interval: NodeJS.Timer;
  private config = {};
  private dir: string;

  private pendingWrites = {};

  private severity = {
    error: clc.red,
    info: clc.blue,
    warn: clc.yellow,
  };

  private severityLevels = ['info', 'warn', 'error'];

  constructor(config: any) {
    this.config = config;
    this.dir = _.get(config, 'files.directory', 'logs');
    this.createDir();
  }

  public removeDir() {
    rimraf.sync(this.dir);
  }

  public createDir() {
    if (!fs.existsSync(this.dir)) {
      try {
        fs.mkdirSync(this.dir);
      } catch (e) {
        throw e;
      }
    }
  }
  public getDir() {
    return this.dir;
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = null;
  }

  public start(cb: () => void = null) {
    const interval = _.get(this.config, 'files.flushInterval', 1);
    this.stop();
    this.interval = setInterval(async () => {
      await this.flush();
      if (cb instanceof Function) {
        cb();
      }
    }, interval * 1000);
  }

  public async flush() {
    for (const fileName of Object.keys(this.pendingWrites)) {
      const data = this.pendingWrites[fileName];
      const appendFile = promisify(fs.appendFile);
      await appendFile(fileName, data);
      delete this.pendingWrites[fileName];
    }
  }

  public getLog(severity: string, levelString: string) {
    const level = _.get(this.config, levelString, '');
    return (
      this.severityLevels.indexOf(severity) >=
      this.severityLevels.indexOf(level)
    );
  }

  public append(
    severity: string,
    system: string,
    text: string,
    data: string[]
  ) {
    const fileLog = this.getLog(severity, 'files.level');
    const consoleLog = this.getLog(severity, 'console.level');

    if (!consoleLog && !fileLog) {
      return;
    }
    let formattedMessage = text;

    if (data) {
      data.unshift(text);
      formattedMessage = format(data);
    }

    const colors = _.get(this.config, 'console.colors');

    if (consoleLog) {
      log(this.toLog(system, formattedMessage, colors, severity));
    }

    if (fileLog) {
      this.appendLog(
        this.toFileName(system, severity),
        this.toLog(system, formattedMessage)
      );
    }
  }

  public toFileName(system: string, severity: string): string {
    return this.dir + '/' + system + '_' + severity + '.log';
  }

  public toLog(
    system: string,
    formattedMessage: string,
    colorful: boolean = false,
    severity: string = ''
  ) {
    const time = dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    if (colorful) {
      return [
        this.severity[severity](time),
        clc.white.bold(' [' + system + '] '),
        formattedMessage,
      ].join('');
    }
    return time + ' [' + system + '] ' + formattedMessage + '\n';
  }

  public appendLog(filename: string, logLine: string) {
    this.pendingWrites[filename] =
      (this.pendingWrites[filename] || '') + logLine;
  }

  public async getStatus() {
    const readdir = promisify(fs.readdir).bind(fs);
    const files = await readdir(this.dir);

    const logs = {};
    for (const file of files) {
      const stats: any = fs.statSync(this.dir + '/' + file);
      logs[file] = {
        changed: Date.parse(stats.mtime) / 1000,
        size: stats.size,
      };
    }
    return logs;
  }
}
