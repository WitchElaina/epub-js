import { RawCapter, Toc, getRawChapter } from '../core/parser';
import { SystemError } from 'bun';

export enum ScrollDirection {
  Up,
  Down,
}
export class OutOfIndexError extends Error {
  solveDirection: ScrollDirection;

  constructor(solveDirection: ScrollDirection) {
    super('Out of index');
    this.solveDirection = solveDirection;
  }
}

export interface RawTextPosition {
  // Which chapter in epub
  tocIndex: number;
  // Which element in chapter, split by <p>, <div>, <span>, etc.
  elementIndex: number;
  // start index
  startIndex: number;
  // end index
  endIndex: number;
}

export class RawTextStream {
  // How many characters in the stream
  size: number;
  // Current xhtml file cache
  cache: RawCapter;
  // Current position in the stream
  position: RawTextPosition;
  // All files in toc array
  tocs: Toc[];

  constructor(tocs: Toc[], size: number, bookmark?: RawTextPosition) {
    this.position = bookmark
      ? {
          ...bookmark,
          tocIndex: bookmark.tocIndex - 1,
        }
      : {
          tocIndex: -1,
          elementIndex: 0,
          startIndex: 0,
          endIndex: size,
        };
    // set size to terminal width
    this.size = size;
    // set cache to empty
    this.cache = {
      title: '',
      content: [],
    };
    this.tocs = tocs;
  }

  // Get current text
  async getText() {
    // if cache is empty, load file
    while (this.cache.content.length === 0) {
      this.position.tocIndex += 1;
      this.cache = await getRawChapter(this.tocs[this.position.tocIndex]);
    }
    return this.cache.content?.[this.position.elementIndex]?.slice(
      this.position.startIndex,
      this.position.endIndex,
    );
  }

  async next() {
    const newStart = this.position.endIndex;
    if (newStart > this.cache.content[this.position.elementIndex].length) {
      const newIndex = this.position.elementIndex + 1;
      if (newIndex < this.cache.content.length) {
        this.position.elementIndex = newIndex;
        this.position.startIndex = 0;
        this.position.endIndex = this.size;
      } else {
        try {
          await this.nextElement();
        } catch (e) {
        } finally {
          return this.getText();
        }
      }
    } else {
      this.position.startIndex = newStart;
      this.position.endIndex = newStart + this.size;
    }
    return this.getText();
  }

  async nextElement() {
    // current file done
    if (this.position.tocIndex + 1 < this.tocs.length) {
      await getRawChapter(this.tocs[++this.position.tocIndex]).then((cache) => {
        this.cache = cache;
        this.position.elementIndex = 0;
        this.position.startIndex = 0;
        this.position.endIndex = this.size;
      });
    }
  }

  async prev() {
    const newEnd = this.position.startIndex;
    if (newEnd <= 0) {
      const newIndex = this.position.elementIndex - 1;
      if (newIndex >= 0) {
        this.position.elementIndex = newIndex;
        this.position.startIndex = 0;
        this.position.endIndex = this.size;
      } else {
        try {
          await this.prevElement();
        } catch (e) {
        } finally {
          return this.getText();
        }
      }
    } else {
      this.position.startIndex = newEnd - this.size;
      this.position.endIndex = newEnd;
    }
    return this.getText();
  }

  async prevElement() {
    if (this.position.tocIndex - 1 >= 0)
      await getRawChapter(this.tocs[--this.position.tocIndex]).then((cache) => {
        this.cache = cache;
        this.position.elementIndex = this.cache.content.length - 1;
        this.position.endIndex = this.cache.content[this.position.elementIndex].length;
        this.position.startIndex = this.position.endIndex - this.size;
      });
  }
}
