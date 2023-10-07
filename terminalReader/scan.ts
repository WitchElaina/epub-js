import { scanDir } from '../core/packer';

// get params from command line
const dir = process.argv[2];

scanDir(dir).then((files) => {
  console.log(files);
});
