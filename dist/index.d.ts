#!/usr/bin/env node
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
export declare function parseMhtmlFile(filePath: string): Promise<MhtmlResult>;
export declare function parseMhtmlContent(content: string): Promise<MhtmlResult>;
export declare function extractMhtmlToHtml(mhtmlPath: string): Promise<string>;
