import { Toc, getAllTocs } from '../core/parser';
import { epubUnzip } from '../core/packer';
import { RawTextStream, RawTextPosition } from './stream';
import chalk from 'chalk';
import { ReaderConfig } from './config';
import { BookmarkManager } from './bookmark';

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
          // clear screen
          this.OSStream.output.write('\x1b[2J');
          // move cursor to top
          this.OSStream.output.write('\x1b[0f');
          // save bookmark
          const bookmarkManager = new BookmarkManager();
          await bookmarkManager.readLocalBookmarks();
          bookmarkManager.addBookmark(this.epubFile, this.stream.position);
          await bookmarkManager.saveLocalBookmarks();
          // exit
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

    // if bookmark exists, load it
    const bookmarkManager = new BookmarkManager();
    await bookmarkManager.readLocalBookmarks();
    const bookmark = bookmarkManager.getBookmark(this.epubFile);

    // set initial stream
    this.stream = new RawTextStream(this.toc, 40, bookmark);

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
      .catch((err) => {});
  }

  async prev() {
    // print previous page
    await this.stream
      .prev()
      .then((prev) => {
        this.output(prev);
      })
      .catch((err) => {});
  }

  async toggleHide() {
    this.hide = !this.hide;
    this.output(this.hide ? '' : await this.stream.getText());
  }

  output(text: string) {
    // clear screen
    this.OSStream.output.write('\x1b[2J');
    // move cursor to top
    this.OSStream.output.write('\x1b[0f');
    // menu
    this.OSStream.output.write(
      chalk.bold.green(
        `Ch ${this.stream.position.tocIndex} / ${this.stream.tocs.length}  Pos ${this.stream.position.startIndex} , ${this.stream.position.endIndex}   El ${this.stream.position.elementIndex} / ${this.stream.cache.content.length}\n`,
      ),
    );
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
