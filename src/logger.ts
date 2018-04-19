import * as fs from "fs";
import { format, promisify } from "util";
import * as dateformat from "dateformat";
import * as clc from "cli-color";
import * as _ from "lodash";
import * as rimraf from "rimraf";

export class Logger {

  private interval: NodeJS.Timer
  private config = {}
  private dir: string

  private pendingWrites = {}

  private severity = {
    'info': clc.blue,
    'warn': clc.yellow,
    'error': clc.red
  }

  private severityLevels = ['info', 'warn', 'error'];

  constructor(config: any) {
    this.config = config;
    this.dir = _.get(config, 'files.directory', 'logs');
    this.createDir();
  }

  removeDir() {
    rimraf.sync(this.dir);
  }

  createDir() {
    if (!fs.existsSync(this.dir)) {
      try {
        fs.mkdirSync(this.dir);
      }
      catch (e) {
        throw e;
      }
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = null;
  }

  start(cb: Function = null) {
    let interval = _.get(this.config, 'files.flushInterval', 1);
    this.stop();
    this.interval = setInterval(async () => {
      await this.flush();
      cb && cb();
    }, interval * 1000);
  }

  async flush() {
    for (var fileName in this.pendingWrites) {
      var data = this.pendingWrites[fileName];
      let appendFile = promisify(fs.appendFile);
      await appendFile(fileName, data);
      delete this.pendingWrites[fileName];
    }
  }

  getLog(severity: string, levelString: string) {
    let level = _.get(this.config, levelString, '');
    console.log('level = ' + level);
    return this.severityLevels.indexOf(severity) >= this.severityLevels.indexOf(level);
  }

  append(severity: string, system: string, text: string, data: Array<string>) {
    let fileLog = this.getLog(severity, 'files.level');
    let consoleLog = this.getLog(severity, 'console.level');

    console.log(consoleLog, fileLog);


    if (!consoleLog && !fileLog) return;
    let formattedMessage = text;

    console.log("data = " + data);
    if (data) {
      console.log('inside data');
      data.unshift(text);
      formattedMessage = format(data);
    }

    let colors = _.get(this.config, 'console.colors');

    if (consoleLog) {
      console.log(this.toLog(system, formattedMessage, colors, severity))
    }

    if (fileLog) {
      this.appendLog(this.toFileName(system, severity), this.toLog(system, formattedMessage));
    }
  }

  toFileName(system: string, severity: string): string {
    return this.dir + '/' + system + '_' + severity + '.log'
  }

  toLog(system: string, formattedMessage: string, colorful: boolean = false, severity: string = '') {
    let time = dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    if (colorful) {
      return [
        this.severity[severity](time),
        clc.white.bold(' [' + system + '] '),
        formattedMessage
      ].join('');
    }
    return time + ' [' + system + '] ' + formattedMessage + "\n";
  }

  appendLog(filename: string, logLine: string) {
    this.pendingWrites[filename] = (this.pendingWrites[filename] || '') + logLine;
  }
};