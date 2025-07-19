#!/usr/bin/env node
import * as fs from 'fs';
import { simpleParser, ParsedMail } from 'mailparser';
import { JSDOM } from 'jsdom';

export interface Resource {
  filename: string;
  contentType: string;
  content: Buffer;
  cid?: string;
}

export interface MhtmlResult {
  html: string;
  resources: Resource[];
  title?: string;
}

export async function parseMhtmlFile(filePath: string): Promise<MhtmlResult> {
  const stream = fs.createReadStream(filePath);
  return parseMhtmlStream(stream);
}

export async function parseMhtmlContent(content: string): Promise<MhtmlResult> {
  return parseMhtmlStream(content);
}

export async function extractMhtmlToHtml(mhtmlPath: string): Promise<string> {
  const result = await parseMhtmlFile(mhtmlPath);
  const htmlWithResources = embedResources(result.html, result.resources);
  return extractContentDiv(htmlWithResources);
}

// Internal functions
async function parseMhtmlStream(input: any): Promise<MhtmlResult> {
  const parsed: ParsedMail = await simpleParser(input, { keepCidLinks: true });
  
  return {
    html: parsed.html || '',
    resources: parsed.attachments.map(attachment => ({
      filename: attachment.filename || `resource_${attachment.cid || Date.now()}`,
      contentType: attachment.contentType,
      content: attachment.content,
      cid: attachment.cid
    })),
    title: parsed.subject
  };
}

function embedResources(html: string, resources: Resource[]): string {
  return resources.reduce((currentHtml, resource) => {
    if (!resource.cid) return currentHtml;
    const dataUrl = `data:${resource.contentType};base64,${resource.content.toString('base64')}`;
    return currentHtml.replace(new RegExp(`cid:${resource.cid}`, 'gi'), dataUrl);
  }, html);
}

function extractContentDiv(html: string): string {
  try {
    const dom = new JSDOM(html);
    const contentDiv = dom.window.document.getElementById('CONTENT');
    
    if (contentDiv) {
      return wrapInHtmlPage(contentDiv.outerHTML);
    }
    
    return html;
  } catch {
    return html;
  }
}

function wrapInHtmlPage(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Content</title>
</head>
<body>
    ${content}
</body>
</html>`;
}

function expandPath(path: string): string {
  return path.startsWith('~/') ? path.replace('~', process.env.HOME || '') : path;
}

// CLI implementation
async function main() {
  const [inputArg, outputArg] = process.argv.slice(2);

  if (!inputArg) {
    console.error('Usage: mhtml-html <input-file> [output-file]');
    process.exit(1);
  }

  try {
    const inputFile = expandPath(inputArg);
    
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: File not found: ${inputFile}`);
      process.exit(1);
    }

    const html = await extractMhtmlToHtml(inputFile);
    
    if (outputArg) {
      const outputFile = expandPath(outputArg);
      fs.writeFileSync(outputFile, html, 'utf8');
      console.log(`Converted MHTML saved to: ${outputFile}`);
    } else {
      console.log(html);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

