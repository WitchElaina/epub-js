export class ReaderConfig {
  // Head
  readonly head = 'Terminal Reader';
  // Prefix shown before each line
  readonly prefix = '❯ ';
  // Reader key map char code
  readonly keyMap = {
    // next page
    next: 'j'.charCodeAt(0),
    // previous page
    prev: 'k'.charCodeAt(0),
    // next chapter
    nextChapter: 'l'.charCodeAt(0),
    // previous chapter
    prevChapter: 'h'.charCodeAt(0),
    // quit <C-c>
    exit: 3,
    // toggle hide <space>
    toggleHide: ' '.charCodeAt(0),
    // delete inputed char <Backspace>
    delete: 127,
  };
}
