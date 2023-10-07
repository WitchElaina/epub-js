import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface Bookmark {
  tocIndex: number;
  elementIndex: number;
  startIndex: number;
}

export class BookmarkManager {
  bookmarks: Map<string, Bookmark>;

  constructor() {
    this.bookmarks = new Map();
  }

  addBookmark(epubFile: string, position: Bookmark) {
    this.bookmarks.set(path.basename(epubFile), {
      tocIndex: position.tocIndex,
      elementIndex: position.elementIndex,
      startIndex: position.startIndex,
    });
  }

  removeBookmark(epubFile: string) {
    this.bookmarks.delete(path.basename(epubFile));
  }

  getBookmark(epubFile: string) {
    return this.bookmarks.get(path.basename(epubFile));
  }

  async readLocalBookmarks() {
    await fs
      .readFile(path.join(os.homedir(), '.terminal-reader-bookmarks'))
      .then((data) => {
        const bookmarksArray = JSON.parse(data.toString());
        this.bookmarks = new Map(bookmarksArray);
      })
      .catch(() => {
        return '';
      });
  }

  async saveLocalBookmarks() {
    await fs.writeFile(
      path.join(os.homedir(), '.terminal-reader-bookmarks'),
      JSON.stringify(Array.from(this.bookmarks.entries())),
    );
  }
}
