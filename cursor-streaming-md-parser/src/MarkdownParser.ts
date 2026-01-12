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
// Do not edit this method
function runStream() {
    currentContainer = document.getElementById('markdownContainer')!;

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


/* 
Please edit the addToken method to support at least inline codeblocks and codeblocks. Feel free to add any other methods you need.
This starter code does token streaming with no styling right now. Your job is to write the parsing logic to make the styling work.

Note: don't be afraid of using globals for state. For this challenge, speed is preferred over cleanliness.
 */
let mode: "NORMAL" | "INLINE_CODE" | "CODE_BLOCK" = "NORMAL";
let backtickBuffer = "";
let activeNode: HTMLElement | null = null;

function toggleInlineCode() {
    if (!currentContainer) return;

    if (mode === "NORMAL") {
        const code = document.createElement("code");
        code.style.background = "#eee";
        code.style.padding = "2px 4px";
        code.style.borderRadius = "4px";
        currentContainer.appendChild(code);
        activeNode = code;
        mode = "INLINE_CODE";
    } else if (mode === "INLINE_CODE") {
        activeNode = null;
        mode = "NORMAL";
    }
}

function toggleCodeBlock() {
    if (!currentContainer) return;

    if (mode === "NORMAL") {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.style.background = "#1e1e1e";
        code.style.color = "#d4d4d4";
        code.style.display = "block";
        code.style.padding = "10px";
        code.style.borderRadius = "6px";
        pre.appendChild(code);
        currentContainer.appendChild(pre);
        activeNode = code;
        mode = "CODE_BLOCK";
    } else if (mode === "CODE_BLOCK") {
        activeNode = null;
        mode = "NORMAL";
    }
}

function addToken(token: string) {
    if (!currentContainer) return;

    for (let i = 0; i < token.length; i++) {
        const char = token[i];

        // 1️⃣ Collect backticks
        if (char === "`") {
            backtickBuffer += "`";
            continue;
        }

        // 2️⃣ Resolve buffered backticks
        if (backtickBuffer.length > 0) {
            if (backtickBuffer.length === 1) {
                toggleInlineCode();
            } else if (backtickBuffer.length === 3) {
                toggleCodeBlock();
            } else {
                // treat weird counts as text
                if (activeNode) {
                    activeNode.textContent += backtickBuffer;
                } else {
                    currentContainer.append(backtickBuffer);
                }
            }
            backtickBuffer = "";
        }

        // 3️⃣ Append character
        if (activeNode) {
            activeNode.textContent += char;
        } else {
            currentContainer.append(char);
        }
    }
}
