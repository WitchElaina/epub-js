import { Parser, ParserOptions } from 'xml2js';
import { promises as fs } from 'fs';
import path from 'path';

// init parser
const parser = new Parser();

export async function getRootFile(epubDir: string, options?: ParserOptions) {
  // read META-INF/container.xml
  const containerPath = path.join(epubDir, 'META-INF', 'container.xml');

  const xml = await fs.readFile(containerPath, 'utf8');
  const result = await parser.parseStringPromise(xml);
  return result.container.rootfiles[0].rootfile[0].$['full-path'];
}

export async function getMetadata(epubDir: string) {
  // get full path of root file
  const rootFilePath = await getRootFile(epubDir);
  const xmlPath = path.join(epubDir, rootFilePath);

  // read root file
  const contentXml = await fs.readFile(xmlPath, 'utf8');
  const content = await parser.parseStringPromise(contentXml);
  return content.package.metadata[0];
}

export interface Toc {
  id: string;
  order?: string;
  label?: string;
  src: string;
}

export async function getTocs(epubDir: string): Promise<Toc[]> {
  // get full path of root file
  const rootFilePath = await getRootFile(epubDir);
  const tocPath = path.join(epubDir, path.dirname(rootFilePath), 'toc.ncx');

  // read toc file
  const tocXml = await fs.readFile(tocPath, 'utf8');
  const toc = await parser.parseStringPromise(tocXml);
  const tocObj = toc.ncx.navMap[0].navPoint.map((navPoint: any) => {
    return {
      id: navPoint.$.id,
      order: navPoint.$.playOrder,
      label: navPoint.navLabel[0].text[0],
      src: path.join(epubDir, path.dirname(rootFilePath), navPoint.content[0].$.src),
    };
  });

  return tocObj;
}

export async function getAllTocs(epubDir: string) {
  // get full path of root file
  const rootFilePath = await getRootFile(epubDir);
  const contentPath = path.join(epubDir, path.dirname(rootFilePath), 'content.opf');

  // read content file
  const contentXml = await fs.readFile(contentPath, 'utf8');
  const content = await parser.parseStringPromise(contentXml);

  // get all toc files
  const manifest = content.package.manifest[0].item;
  const spine = content.package.spine[0].itemref;

  const tocPaths: Toc[] = [];

  spine.forEach((item: any) => {
    const id = item.$.idref;
    const tocItem = manifest.find((item: any) => item.$.id === id);
    if (tocItem) {
      tocPaths.push({
        id: tocItem.$.id,
        src: path.join(epubDir, path.dirname(rootFilePath), tocItem.$.href),
      });
    }
  });

  return tocPaths;
}

export interface RawCapter {
  title: string;
  content: string[];
}

interface XML2JsNode {
  _?: string;
  $$?: XML2JsNode[];
}

function flattenXML2JsNode(node: XML2JsNode, result: string[]) {
  if (node._) {
    result.push(node._);
  }
  if (node.$$) {
    node.$$.forEach((item) => {
      flattenXML2JsNode(item, result);
    });
  }
}

export async function getRawChapter(toc: Toc) {
  // create special parser for chapter
  const parser = new Parser({
    ignoreAttrs: true,
    explicitArray: true,
    explicitChildren: true,
    preserveChildrenOrder: true,
  });
  // read chapter file
  const xml = await fs.readFile(toc.src, 'utf8');
  const result = await parser.parseStringPromise(xml);

  // get content
  const content: string[] = [];

  // flatten result
  flattenXML2JsNode(result.html.body[0], content);

  return {
    title: result.html.head[0].title[0],
    content,
  };
}
