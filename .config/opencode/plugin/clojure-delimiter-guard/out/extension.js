"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function activate(context) {
    console.log('Clojure Delimiter Guard is now active!');
    // Bracket pairs for Clojure
    const bracketPairs = [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '{', close: '}' },
        { open: '"', close: '"' },
        { open: '#{', close: '}' },
        { open: '#(', close: ')' }
    ];
    // Create decoration types for bracket matching
    const bracketDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
        border: '1px solid rgba(255, 255, 0, 0.8)',
        borderRadius: '2px'
    });
    // Update bracket matching
    const updateBracketMatching = (editor) => {
        const document = editor.document;
        if (document.languageId !== 'clojure') {
            editor.setDecorations(bracketDecorationType, []);
            return;
        }
        const text = document.getText();
        const decorations = [];
        const stack = [];
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const position = document.positionAt(i);
            // Skip strings and comments
            if (char === '"') {
                i = skipString(text, i) - 1;
                continue;
            }
            if (char === ';') {
                i = skipComment(text, i) - 1;
                continue;
            }
            // Check for opening brackets
            for (const pair of bracketPairs) {
                if (text.substring(i, i + pair.open.length) === pair.open) {
                    stack.push({ ...pair, position, startIndex: i });
                    i += pair.open.length - 1;
                    break;
                }
            }
            // Check for closing brackets
            for (const pair of bracketPairs) {
                if (text.substring(i, i + pair.close.length) === pair.close) {
                    if (stack.length > 0) {
                        const lastOpen = stack[stack.length - 1];
                        if (lastOpen.open === pair.open && lastOpen.close === pair.close) {
                            // Matching pair found - add decoration
                            const openRange = new vscode.Range(lastOpen.position, document.positionAt(lastOpen.startIndex + lastOpen.open.length));
                            const closeRange = new vscode.Range(position, document.positionAt(i + pair.close.length));
                            decorations.push({
                                range: openRange,
                                hoverMessage: `${pair.open}${pair.close} pair`
                            });
                            decorations.push({
                                range: closeRange,
                                hoverMessage: `${pair.open}${pair.close} pair`
                            });
                            stack.pop();
                            i += pair.close.length - 1;
                            break;
                        }
                    }
                }
            }
        }
        // Apply decorations
        editor.setDecorations(bracketDecorationType, decorations);
    };
    // Skip string literal
    const skipString = (text, i) => {
        let j = i + 1;
        let escape = false;
        while (j < text.length) {
            const ch = text[j];
            if (escape) {
                escape = false;
                j++;
                continue;
            }
            if (ch === "\\") {
                escape = true;
                j++;
                continue;
            }
            if (ch === '"')
                return j + 1;
            j++;
        }
        return j;
    };
    // Skip comment
    const skipComment = (text, i) => {
        let j = i + 1;
        while (j < text.length && text[j] !== '\n') {
            j++;
        }
        return j;
    };
    // Auto-closing pairs
    const autoClosePairs = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        '#{': '}',
        '#(': ')'
    };
    // Handle auto-closing
    const handleAutoClose = (event) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || event.document !== editor.document)
            return;
        const changes = event.contentChanges;
        if (changes.length === 0)
            return;
        const change = changes[0];
        const range = change.range;
        const text = change.text;
        // Check if it's a single character insertion
        if (range.end.isEqual(range.start) && text.length === 1) {
            const char = text;
            for (const [open, close] of Object.entries(autoClosePairs)) {
                if (char === open) {
                    // Check if the next character is not already the close bracket
                    const position = range.end;
                    const line = editor.document.lineAt(position.line);
                    const nextChar = line.text[position.character] || '';
                    if (nextChar !== close && !/[a-zA-Z0-9]/.test(nextChar)) {
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(editor.document.uri, position, close);
                        vscode.workspace.applyEdit(edit);
                    }
                    break;
                }
            }
        }
    };
    // Register for text changes and cursor movement
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateBracketMatching(activeEditor);
    }
    const textChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateBracketMatching(editor);
            handleAutoClose(event);
        }
    });
    const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.textEditor) {
            updateBracketMatching(event.textEditor);
        }
    });
    const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            updateBracketMatching(editor);
        }
    });
    context.subscriptions.push(textChangeDisposable, selectionChangeDisposable, editorChangeDisposable, bracketDecorationType);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map