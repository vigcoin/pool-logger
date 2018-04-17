import * as fs from "fs";
import * as util from "util";
import * as dateFormat from "dateformat";
import * as clc from "cli-color";
import * as _ from "lodash";

export class Logger {

  private interval: any
  private config: any
  private dir: string

  private pendingWrites: any

  private severity: any = {
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

  start() {
    this.stop();
    this.interval = setInterval(() => {
      for (var fileName in this.pendingWrites) {
        var data = this.pendingWrites[fileName];
        fs.appendFile(fileName, data, () => {
          delete this.pendingWrites[fileName];
        });
      }
    }, this.config.files.flushInterval * 1000);
  }

  write(severity: string, system: string, text: string, data: any) {
    let sl = this.severityLevels;
    var logConsole = sl.indexOf(severity) >= sl.indexOf(this.config.console.level);
    var logFiles = sl.indexOf(severity) >= sl.indexOf(this.config.files.level);

    if (!logConsole && !logFiles) return;

    var time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    var formattedMessage = text;

    if (data) {
      data.unshift(text);
      formattedMessage = util.format.apply(null, data);
    }

    if (logConsole) {
      if (this.config.console.colors)
        console.log(this.severity[severity](time) + clc.white.bold(' [' + system + '] ') + formattedMessage);
      else
        console.log(time + ' [' + system + '] ' + formattedMessage);
    }


    if (logFiles) {
      var fileName = this.dir + '/' + system + '_' + severity + '.log';
      var fileLine = time + ' ' + formattedMessage + '\n';
      this.pendingWrites[fileName] = (this.pendingWrites[fileName] || '') + fileLine;
    }
  }

};