#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMhtmlFile = parseMhtmlFile;
exports.parseMhtmlContent = parseMhtmlContent;
exports.extractMhtmlToHtml = extractMhtmlToHtml;
const fs = __importStar(require("fs"));
const mailparser_1 = require("mailparser");
const jsdom_1 = require("jsdom");
async function parseMhtmlFile(filePath) {
    const stream = fs.createReadStream(filePath);
    return parseMhtmlStream(stream);
}
async function parseMhtmlContent(content) {
    return parseMhtmlStream(content);
}
async function extractMhtmlToHtml(mhtmlPath) {
    const result = await parseMhtmlFile(mhtmlPath);
    const htmlWithResources = embedResources(result.html, result.resources);
    return extractContentDiv(htmlWithResources);
}
// Internal functions
async function parseMhtmlStream(input) {
    const parsed = await (0, mailparser_1.simpleParser)(input, { keepCidLinks: true });
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
function embedResources(html, resources) {
    return resources.reduce((currentHtml, resource) => {
        if (!resource.cid)
            return currentHtml;
        const dataUrl = `data:${resource.contentType};base64,${resource.content.toString('base64')}`;
        return currentHtml.replace(new RegExp(`cid:${resource.cid}`, 'gi'), dataUrl);
    }, html);
}
function extractContentDiv(html) {
    try {
        const dom = new jsdom_1.JSDOM(html);
        const contentDiv = dom.window.document.getElementById('CONTENT');
        if (contentDiv) {
            return wrapInHtmlPage(contentDiv.outerHTML);
        }
        return html;
    }
    catch {
        return html;
    }
}
function wrapInHtmlPage(content) {
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
function expandPath(path) {
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
        }
        else {
            console.log(html);
        }
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
