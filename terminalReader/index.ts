import { Toc, getAllTocs } from '../core/parser';
import { epubUnzip } from '../core/packer';
import { RawTextStream, RawTextPosition } from './stream';
import chalk from 'chalk';
import { ReaderConfig } from './config';

const config = new ReaderConfig();
export class TerminalReader {
  // Opened epub file name
  epubFile: string;
  // All files in toc array
  toc: Toc[];
  // Current file
  tocIndex: number;
  // Text stream
  stream: RawTextStream;
  // Stream interface
  OSStream: {
    input: NodeJS.ReadStream;
    output: NodeJS.WriteStream;
  };
  prefix: string;
  hide: boolean;

  constructor(
    epubFile: string,
    OSStream: { input: NodeJS.ReadStream; output: NodeJS.WriteStream },
  ) {
    this.OSStream = OSStream;
    this.prefix = config.prefix;
    this.hide = false;
    this.epubFile = epubFile;
    this.toc = [];
    this.tocIndex = 0;
  }

  keybind() {
    this.OSStream.input.setRawMode(true);
    // listen to stdin
    this.OSStream.input.on('data', async (keys: Buffer) => {
      keys.forEach(async (key: any) => {
        if (key === config.keyMap.next) {
          await this.next();
        } else if (key === config.keyMap.prev) {
          await this.prev();
        } else if (key === config.keyMap.exit) {
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

  async start() {
    // get toc
    const epubDir = await epubUnzip(this.epubFile);
    this.toc = await getAllTocs(epubDir);

    // set initial stream
    this.stream = new RawTextStream(this.toc, 40);

    // print first page
    this.output(await this.stream.getText());
    this.keybind();
  }

  async next() {
    // print next page
    await this.stream
      .next()
      .then((next) => {
        this.output(next);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async prev() {
    // print previous page
    await this.stream
      .prev()
      .then((prev) => {
        this.output(prev);
      })
      .catch((err) => {
        console.log(err);
      });
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

new TerminalReader(epubFilePath, {
  input: process.stdin,
  output: process.stdout,
}).start();
