# 🚀 Streaming Markdown Parser

A real-time **streaming Markdown parser** built with **TypeScript**, designed to handle chunked text input from AI/LLM streams (ChatGPT, Claude, Cursor, etc.) using **optimistic rendering** and **append-only DOM updates**.

---

## ✨ Key Highlights

- ⚡ **True Streaming Parsing** – handles randomly chunked input
- 🎯 **Optimistic Rendering** – styles elements immediately on opening markers
- 🧠 **State Machine Driven** – robust across token boundaries
- 📝 **Text Remains Selectable** – no DOM replacement, no flicker
- 📦 **Zero Dependencies** – pure TypeScript + DOM APIs

---

## 📸 Demo


> Open `dist/index.html` and click **STREAM** to see it in action.

---

## ✅ Supported Markdown Features

| Feature | Syntax |
|------|------|
| Headings | `# H1` → `###### H6` |
| Italics | `*italic*` |
| Bold | `**bold**` |
| Inline Code | `` `code` `` |
| Code Blocks | ``` ``` |
| Ordered Lists | `1. item` |
| Unordered Lists | `- item` |

> The parser is optimized for **streaming correctness**, not full CommonMark compliance.

---

## 🧠 Architecture Overview

## 🔁 Streaming State Machine

The parser processes **one character at a time**, maintaining global state across streamed tokens.

```text
NORMAL
 ├── `        → INLINE_CODE
 │               └── `        → NORMAL
 │
 ├── ```      → CODE_BLOCK
 │               └── ```      → NORMAL
 │
 ├── *        → ITALIC
 ├── **       → BOLD
 │
 └── \n       → LINE PROCESSING
                  (headings, lists, paragraphs)
```


---

## 🏗️ Design Decisions

1. **Character-Level Parsing**  
   Ensures correctness even when tokens split in the middle of markdown markers.

2. **Optimistic Element Creation**  
   DOM elements are created as soon as opening markers are detected.

3. **Append-Only DOM Updates**  
   Uses `appendChild` and `textContent +=` to preserve text selection.

4. **Line-Based Structural Parsing**  
   Headings and lists are resolved only at newline boundaries.

---


## 📁 Project Structure

```text
├── src/
│   └── MarkdownParser.ts   # Core streaming parser logic
├── public/
│   └── index.html          # Demo HTML
├── dist/                   # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md

```

---

## 🚀 Getting Started

### Install dependencies
```bash
npm install
```

Build the project
```bash
npm run build
```

Run the demo

Open:
```bash
dist/index.html
```

Development mode (watch)
```bash
npm run dev
```

## 🧪 How Streaming Is Simulated

The demo mimics LLM behavior by:

Splitting Markdown into random 2–20 character chunks

Feeding tokens every 20ms

Persisting parser state across chunks

Example:

Token 1: "```ba"
Token 2: "sh\ngi"
Token 3: "t clo"


The parser still correctly renders a code block.

## 🎨 Styling Notes
| Element     | Style                             |
| ----------- | --------------------------------- |
| Inline Code | Light background, rounded corners |
| Code Blocks | Dark background, monospace        |
| Headings    | Scaled font sizes                 |
| Bold        | `font-weight: 700`                |
| Italic      | `font-style: italic`              |


Styling is intentionally minimal; focus is on parsing logic.

## 📈 Performance Characteristics

Time Complexity: O(n)

DOM Operations: O(1) per character

Reflows: None (append-only)

Memory: Constant extra space

## 🎯 Scope & Limitations

✔ Optimized for streaming correctness

✔ Handles split tokens safely

❌ Not a full Markdown spec implementation

❌ No nested emphasis edge cases

This tradeoff is intentional for real-time streaming scenarios.
