import AdmZip from 'adm-zip';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const TEMP_DIR = path.join(os.tmpdir(), 'epub_temp_folder');

/**
 * Unzip epub file to system temp folder
 * @param epubFilePath Epub file to unzip
 * @returns Unzipped file path
 */
export async function epubUnzip(epubFilePath: string): Promise<string> {
  const zip = new AdmZip(epubFilePath);
  const epubFileName = path.basename(epubFilePath, path.extname(epubFilePath));

  // make temp dir
  const dir = path.join(TEMP_DIR, epubFileName);
  await fs.mkdir(dir, { recursive: true });

  // unzip to temp dir
  zip.extractAllTo(dir, true);

  // return unzipped dir
  return dir;
}

/**
 * Scan directory recursively and return epub file paths
 * @param dirPath Directory to scan
 * @returns Array of epub file paths
 */
export async function scanDir(dirPath: string): Promise<any[]> {
  const epubFiles = [];
  dirPath = path.resolve(dirPath);
  console.log(`Scan dir: ${dirPath}`);
  const files = await fs.readdir(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await scanDir(filePath);
    } else if (stat.isFile()) {
      if (path.extname(filePath) === '.epub') {
        const fileContent = await fs.readFile(filePath);
        // cal eTag using md5 (AWS S3 uses this algorithm)
        const eTag = crypto.createHash('md5').update(fileContent).digest('hex');
        epubFiles.push({
          name: path.basename(filePath),
          path: filePath,
          eTag,
        });
      }
    }
  }
  return epubFiles;
}
