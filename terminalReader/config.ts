export class ReaderConfig {
  // Head
  readonly head = "Terminal Reader";
  // Prefix shown before each line
  readonly prefix = '❯ ';
  // Reader key map
  readonly keyMap = {
    // next page
    next: 106,
    // previous page
    prev: 107,
    // quit
    exit: 3,
    // toggle hide
    toggleHide: 32,
    // delete inputed char
    delete: 127,
  };
}