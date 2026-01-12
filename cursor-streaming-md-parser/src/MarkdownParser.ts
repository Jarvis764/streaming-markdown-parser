const blogpostMarkdown = `# control

*humans should focus on bigger problems*

## Setup

\`\`\`bash
git clone git@github.com:anysphere/control
\`\`\`

\`\`\`bash
./init.sh
\`\`\`

## Folder structure

**The most important folders are:**

1. \`vscode\`: this is our fork of vscode, as a submodule.
2. \`milvus\`: this is where our Rust server code lives.
3. \`schema\`: this is our Protobuf definitions for communication between the client and the server.

Each of the above folders should contain fairly comprehensive README files; please read them. If something is missing, or not working, please add it to the README!

Some less important folders:

1. \`release\`: this is a collection of scripts and guides for releasing various things.
2. \`infra\`: infrastructure definitions for the on-prem deployment.
3. \`third_party\`: where we keep our vendored third party dependencies.

## Miscellaneous things that may or may not be useful

##### Where to find rust-proto definitions

They are in a file called \`aiserver.v1.rs\`. It might not be clear where that file is. Run \`rg --files --no-ignore bazel-out | rg aiserver.v1.rs\` to find the file.

## Releasing

Within \`vscode/\`:

- Bump the version
- Then:

\`\`\`
git checkout build-todesktop
git merge main
git push origin build-todesktop
\`\`\`

- Wait for 14 minutes for gulp and ~30 minutes for todesktop
- Go to todesktop.com, test the build locally and hit release
`;

let currentContainer: HTMLElement | null = null;

// ═══════════════════════════════════════════════════════════════════
// STATE MACHINE - Extended for Full Markdown Support
// ═══════════════════════════════════════════════════════════════════

enum State {
  TEXT,              // Normal text mode
  BACKTICK_1,        // Seen 1 backtick, waiting to determine type
  BACKTICK_2,        // Seen 2 backticks, need 3rd for code block
  INLINE_CODE,       // Inside inline code `...`
  CODE_BLOCK_LANG,   // Inside code block, skipping language identifier
  CODE_BLOCK,        // Inside code block content ```...```
  CODE_BLOCK_END_1,  // In code block, seen 1 potential closing backtick
  CODE_BLOCK_END_2,  // In code block, seen 2 potential closing backticks
  ASTERISK_1,        // Seen 1 asterisk - could be italic or bold
  BOLD,              // Inside bold **...**
  BOLD_END_1,        // In bold, seen 1 potential closing asterisk
  ITALIC,            // Inside italic *...*
  LINE_START,        // At start of new line - check for headings/lists
  HEADING_HASHES,    // Counting # for heading level
  LIST_ITEM,         // Inside a list item
}

// Global state - persists across token chunks
let state: State = State.LINE_START;
let activeTextNode: Text | null = null;

// Extended state for headings and lists
let headingLevel: number = 0;
let lineBuffer: string = '';
let isAtLineStart: boolean = true;
let currentWrapper: HTMLElement | null = null;

// ═══════════════════════════════════════════════════════════════════
// DOM HELPERS
// ═══════════════════════════════════════════════════════════════════

function getActiveContainer(): HTMLElement {
  return currentWrapper || currentContainer!;
}

function ensureTextNode(): void {
  if (!activeTextNode) {
    const container = getActiveContainer();
    if (container) {
      activeTextNode = document.createTextNode('');
      container.appendChild(activeTextNode);
    }
  }
}

function createInlineCode(): void {
  const container = getActiveContainer();
  if (!container) return;
  
  const code = document.createElement('code');
  code.style.backgroundColor = '#e4e4e7';
  code.style.padding = '2px 6px';
  code.style.borderRadius = '4px';
  code.style.fontFamily = 'ui-monospace, SFMono-Regular, "SF Mono", monospace';
  code.style.fontSize = '0.875em';
  code.style.color = '#be185d';
  
  activeTextNode = document.createTextNode('');
  code.appendChild(activeTextNode);
  container.appendChild(code);
}

function createCodeBlock(): void {
  if (!currentContainer) return;
  
  // Close any open wrapper first
  currentWrapper = null;
  
  const pre = document.createElement('pre');
  pre.style.backgroundColor = '#1e1e1e';
  pre.style.color = '#d4d4d4';
  pre.style.padding = '16px';
  pre.style.borderRadius = '8px';
  pre.style.fontFamily = 'ui-monospace, SFMono-Regular, "SF Mono", monospace';
  pre.style.fontSize = '0.875em';
  pre.style.lineHeight = '1.6';
  pre.style.whiteSpace = 'pre';
  pre.style.overflowX = 'auto';
  pre.style.margin = '16px 0';
  
  const code = document.createElement('code');
  activeTextNode = document.createTextNode('');
  code.appendChild(activeTextNode);
  pre.appendChild(code);
  currentContainer.appendChild(pre);
}

function createHeading(level: number): void {
  if (!currentContainer) return;
  
  currentWrapper = null;
  
  const heading = document.createElement(`h${level}` as keyof HTMLElementTagNameMap) as HTMLElement;
  const sizes = ['2.25em', '1.875em', '1.5em', '1.25em', '1.1em', '1em'];
  heading.style.fontSize = sizes[level - 1] || '1em';
  heading.style.fontWeight = 'bold';
  heading.style.margin = '24px 0 16px 0';
  heading.style.lineHeight = '1.3';
  heading.style.color = '#1f2937';
  
  activeTextNode = document.createTextNode('');
  heading.appendChild(activeTextNode);
  currentContainer.appendChild(heading);
  currentWrapper = heading;
}

function createListItem(): void {
  if (!currentContainer) return;
  
  currentWrapper = null;
  
  const li = document.createElement('div');
  li.style.display = 'flex';
  li.style.marginLeft = '20px';
  li.style.marginBottom = '4px';
  
  const bullet = document.createElement('span');
  bullet.textContent = '- ';
  bullet.style.marginRight = '8px';
  bullet.style.color = '#6b7280';
  li.appendChild(bullet);
  
  const content = document.createElement('span');
  activeTextNode = document.createTextNode('');
  content.appendChild(activeTextNode);
  li.appendChild(content);
  
  currentContainer.appendChild(li);
  currentWrapper = content;
}

function createNumberedListItem(num: string): void {
  if (!currentContainer) return;
  
  currentWrapper = null;
  
  const li = document.createElement('div');
  li.style.display = 'flex';
  li.style.marginLeft = '20px';
  li.style.marginBottom = '4px';
  
  const number = document.createElement('span');
  number.textContent = num + '. ';
  number.style.marginRight = '8px';
  number.style.color = '#6b7280';
  number.style.fontWeight = '500';
  li.appendChild(number);
  
  const content = document.createElement('span');
  activeTextNode = document.createTextNode('');
  content.appendChild(activeTextNode);
  li.appendChild(content);
  
  currentContainer.appendChild(li);
  currentWrapper = content;
}

function createBold(): void {
  const container = getActiveContainer();
  if (!container) return;
  
  const bold = document.createElement('strong');
  bold.style.fontWeight = '700';
  
  activeTextNode = document.createTextNode('');
  bold.appendChild(activeTextNode);
  container.appendChild(bold);
}

function createItalic(): void {
  const container = getActiveContainer();
  if (!container) return;
  
  const italic = document.createElement('em');
  italic.style.fontStyle = 'italic';
  
  activeTextNode = document.createTextNode('');
  italic.appendChild(activeTextNode);
  container.appendChild(italic);
}

function write(char: string): void {
  if (activeTextNode) {
    activeTextNode.textContent += char;
  }
}

function closeElement(): void {
  activeTextNode = null;
}

function closeLine(): void {
  activeTextNode = null;
  currentWrapper = null;
  isAtLineStart = true;
}

// ═══════════════════════════════════════════════════════════════════
// CORE STATE MACHINE - CHARACTER BY CHARACTER (Extended)
// ═══════════════════════════════════════════════════════════════════

function processTextChar(char: string): void {
  // Handle newlines - reset to line start
  if (char === '\n') {
    ensureTextNode();
    write(char);
    closeLine();
    state = State.LINE_START;
    lineBuffer = '';
    return;
  }
  
  // Handle backticks for code
  if (char === '`') {
    state = State.BACKTICK_1;
    return;
  }
  
  // Handle asterisks for bold/italic
  if (char === '*') {
    state = State.ASTERISK_1;
    return;
  }
  
  // Regular text
  ensureTextNode();
  write(char);
}

function processChar(char: string): void {
  switch (state) {
    
    // ─────────────────────────────────────────────────────
    // LINE START - Check for headings, lists, etc.
    // ─────────────────────────────────────────────────────
    case State.LINE_START:
      lineBuffer += char;
      
      // Check for heading
      if (char === '#' && lineBuffer.length === 1) {
        headingLevel = 1;
        state = State.HEADING_HASHES;
        return;
      }
      
      // Check for unordered list (- only, * is for italic)
      if (char === '-' && lineBuffer.length === 1) {
        // Wait for next char to confirm list
        return;
      }
      
      // Check for numbered list (1. 2. etc.)
      if (char >= '0' && char <= '9' && lineBuffer.length === 1) {
        return;
      }
      
      // Continue collecting digits for numbered list
      if (lineBuffer.length >= 2 && /^\d+$/.test(lineBuffer.slice(0, -1)) && char >= '0' && char <= '9') {
        return;
      }
      
      // Check for list confirmation (- followed by space)
      if (lineBuffer.length === 2 && lineBuffer[0] === '-' && char === ' ') {
        createListItem();
        state = State.TEXT;
        lineBuffer = '';
        return;
      }
      
      // Check numbered list (e.g., "1. ")
      if (char === '.' && lineBuffer.length >= 2) {
        const numPart = lineBuffer.slice(0, -1);
        if (/^\d+$/.test(numPart)) {
          // Wait for space
          return;
        }
      }
      
      if (char === ' ' && lineBuffer.length >= 3) {
        const withoutSpace = lineBuffer.slice(0, -1);
        if (withoutSpace.endsWith('.')) {
          const numPart = withoutSpace.slice(0, -1);
          if (/^\d+$/.test(numPart)) {
            createNumberedListItem(numPart);
            state = State.TEXT;
            lineBuffer = '';
            return;
          }
        }
      }
      
      // Empty lines
      if (char === '\n') {
        ensureTextNode();
        write(char);
        lineBuffer = '';
        return;
      }
      
      // Not a special line start, process as text
      // Save buffer before clearing
      const savedBuffer = lineBuffer;
      lineBuffer = '';
      state = State.TEXT;
      
      // Re-process all buffered chars through the full state machine
      for (const c of savedBuffer) {
        processChar(c);
      }
      break;

    // ─────────────────────────────────────────────────────
    // HEADING - Counting hash marks
    // ─────────────────────────────────────────────────────
    case State.HEADING_HASHES:
      if (char === '#') {
        headingLevel++;
        if (headingLevel > 6) headingLevel = 6;
      } else if (char === ' ') {
        // Space after hashes confirms heading
        createHeading(headingLevel);
        state = State.TEXT;
        lineBuffer = '';
      } else {
        // Not a valid heading, output as text
        state = State.TEXT;
        ensureTextNode();
        for (let i = 0; i < headingLevel; i++) {
          write('#');
        }
        write(char);
        lineBuffer = '';
      }
      break;

    // ─────────────────────────────────────────────────────
    // NORMAL TEXT
    // ─────────────────────────────────────────────────────
    case State.TEXT:
      processTextChar(char);
      break;

    // ─────────────────────────────────────────────────────
    // SEEN 1 BACKTICK - could be inline or start of fence
    // ─────────────────────────────────────────────────────
    case State.BACKTICK_1:
      if (char === '`') {
        state = State.BACKTICK_2;
      } else {
        // Single backtick + char = INLINE CODE starts
        createInlineCode();
        write(char);
        state = State.INLINE_CODE;
      }
      break;

    // ─────────────────────────────────────────────────────
    // SEEN 2 BACKTICKS - need 3rd for code block
    // ─────────────────────────────────────────────────────
    case State.BACKTICK_2:
      if (char === '`') {
        // Triple backtick = CODE BLOCK
        createCodeBlock();
        state = State.CODE_BLOCK_LANG;
      } else {
        // Just 2 backticks = output literal ``
        ensureTextNode();
        write('`');
        write('`');
        write(char);
        state = State.TEXT;
      }
      break;

    // ─────────────────────────────────────────────────────
    // INSIDE INLINE CODE
    // ─────────────────────────────────────────────────────
    case State.INLINE_CODE:
      if (char === '`') {
        // Closing backtick - end inline code
        closeElement();
        state = State.TEXT;
      } else {
        write(char);
      }
      break;

    // ─────────────────────────────────────────────────────
    // CODE BLOCK: SKIPPING LANGUAGE IDENTIFIER LINE
    // ─────────────────────────────────────────────────────
    case State.CODE_BLOCK_LANG:
      if (char === '\n') {
        // Newline ends language line, now in actual code content
        state = State.CODE_BLOCK;
      }
      // Skip all chars until newline (language identifier)
      break;

    // ─────────────────────────────────────────────────────
    // INSIDE CODE BLOCK CONTENT
    // ─────────────────────────────────────────────────────
    case State.CODE_BLOCK:
      if (char === '`') {
        state = State.CODE_BLOCK_END_1;
      } else {
        write(char);
      }
      break;

    // ─────────────────────────────────────────────────────
    // CODE BLOCK: SEEN 1 POTENTIAL CLOSING BACKTICK
    // ─────────────────────────────────────────────────────
    case State.CODE_BLOCK_END_1:
      if (char === '`') {
        state = State.CODE_BLOCK_END_2;
      } else {
        // False alarm - output the buffered backtick
        write('`');
        write(char);
        state = State.CODE_BLOCK;
      }
      break;

    // ─────────────────────────────────────────────────────
    // CODE BLOCK: SEEN 2 POTENTIAL CLOSING BACKTICKS
    // ─────────────────────────────────────────────────────
    case State.CODE_BLOCK_END_2:
      if (char === '`') {
        // Triple backtick = close code block
        closeElement();
        state = State.LINE_START;
        lineBuffer = '';
      } else {
        // False alarm - output buffered backticks
        write('`');
        write('`');
        write(char);
        state = State.CODE_BLOCK;
      }
      break;

    // ─────────────────────────────────────────────────────
    // SEEN 1 ASTERISK - could be italic or bold
    // ─────────────────────────────────────────────────────
    case State.ASTERISK_1:
      if (char === '*') {
        // Double asterisk = BOLD starts
        createBold();
        state = State.BOLD;
      } else if (char === ' ' || char === '\n') {
        // Asterisk followed by space is just text (likely list handled earlier)
        ensureTextNode();
        write('*');
        if (char === '\n') {
          write(char);
          closeLine();
          state = State.LINE_START;
          lineBuffer = '';
        } else {
          write(char);
          state = State.TEXT;
        }
      } else {
        // Single asterisk + char = ITALIC starts
        createItalic();
        write(char);
        state = State.ITALIC;
      }
      break;

    // ─────────────────────────────────────────────────────
    // INSIDE BOLD
    // ─────────────────────────────────────────────────────
    case State.BOLD:
      if (char === '*') {
        state = State.BOLD_END_1;
      } else {
        write(char);
      }
      break;

    // ─────────────────────────────────────────────────────
    // BOLD: SEEN 1 POTENTIAL CLOSING ASTERISK
    // ─────────────────────────────────────────────────────
    case State.BOLD_END_1:
      if (char === '*') {
        // Double asterisk = close bold
        closeElement();
        state = State.TEXT;
      } else {
        // False alarm - single asterisk inside bold
        write('*');
        write(char);
        state = State.BOLD;
      }
      break;

    // ─────────────────────────────────────────────────────
    // INSIDE ITALIC
    // ─────────────────────────────────────────────────────
    case State.ITALIC:
      if (char === '*') {
        // Closing asterisk - end italic
        closeElement();
        state = State.TEXT;
      } else {
        write(char);
      }
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ENTRY POINT - PROCESS EACH TOKEN
// ═══════════════════════════════════════════════════════════════════

function addToken(token: string) {
  if (!currentContainer) return;
  
  // Process character by character to handle split tokens
  for (let i = 0; i < token.length; i++) {
    processChar(token[i]);
  }
}

// Do not edit this method
function runStream() {
  currentContainer = document.getElementById('markdownContainer')!;
  
  // Clear previous content
  currentContainer.innerHTML = '';
  
  // Reset all state for new stream
  state = State.LINE_START;
  activeTextNode = null;
  headingLevel = 0;
  lineBuffer = '';
  isAtLineStart = true;
  currentWrapper = null;

  // this randomly split the markdown into tokens between 2 and 20 characters long
  // simulates the behavior of an ml model thats giving you weirdly chunked tokens
  const tokens: string[] = [];
  let remainingMarkdown = blogpostMarkdown;
  while (remainingMarkdown.length > 0) {
    const tokenLength = Math.floor(Math.random() * 18) + 2;
    const token = remainingMarkdown.slice(0, tokenLength);
    tokens.push(token);
    remainingMarkdown = remainingMarkdown.slice(tokenLength);
  }

  const toCancel = setInterval(() => {
    const token = tokens.shift();
    if (token) {
      addToken(token);
    } else {
      clearInterval(toCancel);
    }
  }, 20);
}
