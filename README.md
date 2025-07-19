# mhtml-html

A TypeScript tool to convert MHTML files to standalone HTML.

## Usage

### CLI with NPX

Convert an MHTML file to HTML:

```bash
npx mhtml-html <path-to-mhtml-file> [output-file]
```

Examples:
```bash
# Output to console
npx mhtml-html document.mhtml

# Save to file
npx mhtml-html document.mhtml output.html

# Support for tilde expansion
npx mhtml-html ~/Downloads/document.mhtml ~/Desktop/output.html
```

### Programmatic Usage

```typescript
import { parseMhtmlFile, extractMhtmlToHtml } from 'mhtml-html';

// Parse MHTML and get structured data
const result = await parseMhtmlFile('document.mhtml');
console.log(result.html, result.resources, result.title);

// Extract directly to standalone HTML
const html = await extractMhtmlToHtml('document.mhtml');
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev <input-file>
```

## Build

To build the project from source, you'll need to have Node.js and npm installed.

1.  Clone the repository:
    ```bash
    git clone https://github.com/varlabz/mhtml-html.git
    cd mhtml-html
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```
