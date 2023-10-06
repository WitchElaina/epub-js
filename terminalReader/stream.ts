import { RawCapter, Toc, getRawChapterByToc } from '../core/parser';

export interface RawTextPosition {
  // Which chapter in epub
  toc: Toc;
  // Which element in chapter, split by <p>, <div>, <span>, etc.
  elementIndex: number;
  // start index
  startIndex: number;
  // end index
  endIndex: number;
}

export enum ScrollDirection {
  Up,
  Down,
}

export class RawTextStream {
  // How many characters in the stream
  size: number;
  // Current xhtml file cache
  cache: RawCapter;
  // Current position in the stream
  position: RawTextPosition;

  constructor(position: RawTextPosition, size: number = process.stdout.columns / 2) {
    this.position = position;
    // set size to terminal width
    this.size = size;
    // set cache to empty
    this.cache = {
      title: '',
      content: [],
    };
  }

  // Get current text
  async getText() {
    // if cache is empty, load file
    if (!this.cache.content.length) {
      this.cache = await getRawChapterByToc(this.position.toc);
    }
    return this.cache.content[this.position.elementIndex].slice(
      this.position.startIndex,
      this.position.endIndex,
    );
  }

  async next() {
    const newStart = this.position.endIndex;
    if (newStart > this.cache.content[this.position.elementIndex].length) {
      const newIndex = this.position.elementIndex + 1;
      if (newIndex in this.cache.content) {
        this.position.elementIndex = newIndex;
        this.position.startIndex = 0;
        this.position.endIndex = this.size;
      }
    } else {
      this.position.startIndex = newStart;
      this.position.endIndex = newStart + this.size;
    }
    return this.getText();
  }

  async prev() {
    const newEnd = this.position.startIndex;
    if (newEnd <= 0) {
      const newIndex = this.position.elementIndex - 1;
      if (newIndex in this.cache.content) {
        this.position.elementIndex = newIndex;
        this.position.startIndex = 0;
        this.position.endIndex = this.size;
      }
    } else {
      this.position.startIndex = newEnd - this.size;
      this.position.endIndex = newEnd;
    }
    return this.getText();
  }
}
