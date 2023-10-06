import { getTocs } from '../core/parser';
import { epubUnzip } from '../core/packer';
import { RawTextStream, RawTextPosition } from './stream';
import chalk from 'chalk';
import { ReaderConfig } from './config';

const config = new ReaderConfig();

export class TerminalReader {
  // Current file
  position: RawTextPosition;
  // Text stream
  stream: RawTextStream;
  // Stream interface
  OSStream: {
    input: NodeJS.ReadStream;
    output: NodeJS.WriteStream;
  };
  prefix: string;
  hide: boolean;

  constructor(position: RawTextPosition, size: number) {
    this.position = position;
    this.OSStream = {
      input: process.stdin,
      output: process.stdout,
    };
    this.OSStream.input.setRawMode(true);
    this.stream = new RawTextStream(position, size);
    this.prefix = config.prefix;
    this.hide = false;
  }

  async start() {
    this.output(await this.stream.getText());
    // listen to stdin
    this.OSStream.input.on('data', async (keys: Buffer) => {
      keys.forEach(async (key: any) => {
        if (key === config.keyMap.next) {
          await this.next();
        } else if (key === config.keyMap.prev) {
          await this.prev();
        } else if (key === config.keyMap.next) {
          process.exit(0);
        } else if (key === config.keyMap.toggleHide) {
          this.toggleHide();
        } else if (key === config.keyMap.delete) {
          this.OSStream.output.write('\x1b[2K');
          this.OSStream.output.write('\r');
        } else {
          if (this.hide) {
            // convert code to char
            this.OSStream.output.write(String.fromCharCode(key));
          }
        }
      });
    });
  }

  async next() {
    // print next page
    const next = await this.stream.next();
    this.output(next);
  }

  async prev() {
    // print previous page
    const prev = await this.stream.prev();
    this.output(prev);
  }

  async toggleHide() {
    this.hide = !this.hide;
    this.output(this.hide ? '' : await this.stream.getText());
  }

  output(text: string) {
    // clear last line
    this.OSStream.output.write('\x1b[2K');
    // move cursor to start of line
    this.OSStream.output.write('\r');
    // print prefix
    this.OSStream.output.write(chalk.bold.blue(this.prefix));
    // print text
    this.OSStream.output.write(chalk.bold.gray.dim(text));
  }
}

// read file from params
const epubFilePath = process.argv[2];
const epubTocIndex = (process.argv[3] as unknown as number) || 0;
const epubDir = await epubUnzip(epubFilePath);

const toc = await getTocs(epubDir);

const initSize = (process.stdout.columns - 4) / 2;
const reader = new TerminalReader(
  {
    toc: toc[epubTocIndex],
    elementIndex: 0,
    startIndex: 0,
    endIndex: initSize,
  },
  initSize,
);

reader.start();
