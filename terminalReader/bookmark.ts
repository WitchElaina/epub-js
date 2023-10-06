import { RawTextPosition } from './stream';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export class BookmarkManager {
  bookmarks: Map<string, RawTextPosition>;

  constructor() {
    this.bookmarks = new Map();
  }

  addBookmark(epubFile: string, position: RawTextPosition) {
    this.bookmarks.set(path.basename(epubFile), position);
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
