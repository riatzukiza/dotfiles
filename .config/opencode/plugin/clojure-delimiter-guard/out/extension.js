"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
class BracketMatcher {
    constructor() {
        this.decorationCache = new Map();
        this.bracketPairs = [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"' },
            { open: '#{', close: '}' },
            { open: '#(', close: ')' },
            { open: '#"', close: '"' }, // Regex
            { open: '#\'', close: '' }, // Var quote (no closing)
            { open: '#@', close: '' }, // Metadata (no closing)
        ];
    }
    getOrCreateDecoration(key) {
        if (!this.decorationCache.has(key)) {
            const config = vscode.workspace.getConfiguration('clojureDelimiterGuard');
            const highlightColor = config.get('highlightColor', 'editor.wordHighlightBackground');
            const borderColor = config.get('borderColor', 'editor.wordHighlightBorder');
            this.decorationCache.set(key, vscode.window.createTextEditorDecorationType({
                backgroundColor: new vscode.ThemeColor(highlightColor),
                border: '1px solid',
                borderColor: new vscode.ThemeColor(borderColor),
                borderRadius: '2px'
            }));
        }
        return this.decorationCache.get(key);
    }
    skipString(text, i) {
        let j = i + 1;
        while (j < text.length) {
            const ch = text[j];
            if (ch === '\\') {
                j += 2; // Skip escape sequence
                continue;
            }
            if (ch === '"')
                return j + 1;
            j++;
        }
        return j;
    }
    skipComment(text, i) {
        let j = i + 1;
        while (j < text.length && text[j] !== '\n') {
            j++;
        }
        return j;
    }
    getScanRange(editor) {
        const config = vscode.workspace.getConfiguration('clojureDelimiterGuard');
        const scanBuffer = config.get('scanBuffer', 50);
        const visibleRange = editor.visibleRanges[0];
        if (!visibleRange) {
            return new vscode.Range(0, 0, editor.document.lineCount - 1, 0);
        }
        const bufferStart = Math.max(0, visibleRange.start.line - scanBuffer);
        const bufferEnd = Math.min(editor.document.lineCount - 1, visibleRange.end.line + scanBuffer);
        const startPos = new vscode.Position(bufferStart, 0);
        const endPos = new vscode.Position(bufferEnd, editor.document.lineAt(bufferEnd).text.length);
        return new vscode.Range(startPos, endPos);
    }
    updateDecorations(editor) {
        try {
            if (!editor || !editor.document)
                return;
            const config = vscode.workspace.getConfiguration('clojureDelimiterGuard');
            const enabled = config.get('enabled', true);
            if (!enabled) {
                this.clearAllDecorations(editor);
                return;
            }
            const document = editor.document;
            if (document.languageId !== 'clojure') {
                this.clearAllDecorations(editor);
                return;
            }
            const scanRange = this.getScanRange(editor);
            const text = document.getText(scanRange);
            const decorations = [];
            const stack = [];
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const absoluteIndex = document.offsetAt(scanRange.start) + i;
                const position = document.positionAt(absoluteIndex);
                // Skip strings and comments
                if (char === '"') {
                    i = this.skipString(text, i) - 1;
                    continue;
                }
                if (char === ';') {
                    i = this.skipComment(text, i) - 1;
                    continue;
                }
                // Check for opening brackets
                for (const pair of this.bracketPairs) {
                    if (text.substring(i, i + pair.open.length) === pair.open) {
                        stack.push({ ...pair, position, startIndex: absoluteIndex });
                        i += pair.open.length - 1;
                        break;
                    }
                }
                // Check for closing brackets
                for (const pair of this.bracketPairs) {
                    if (pair.close && text.substring(i, i + pair.close.length) === pair.close) {
                        if (stack.length > 0) {
                            const lastOpen = stack[stack.length - 1];
                            if (lastOpen.open === pair.open && lastOpen.close === pair.close) {
                                // Matching pair found - add decoration
                                const openRange = new vscode.Range(lastOpen.position, document.positionAt(lastOpen.startIndex + lastOpen.open.length));
                                const closeRange = new vscode.Range(position, document.positionAt(absoluteIndex + pair.close.length));
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
            const decorationType = this.getOrCreateDecoration('bracket');
            editor.setDecorations(decorationType, decorations);
        }
        catch (error) {
            console.error('Error in bracket matching:', error);
            this.clearAllDecorations(editor);
        }
    }
    clearAllDecorations(editor) {
        this.decorationCache.forEach(decoration => {
            editor.setDecorations(decoration, []);
        });
    }
    dispose() {
        this.decorationCache.forEach(decoration => decoration.dispose());
        this.decorationCache.clear();
    }
}
class AutoCloser {
    constructor() {
        this.autoClosePairs = {
            '(': ')',
            '[': ']',
            '{': '}',
            '"': '"',
            '#{': '}',
            '#(': ')'
        };
    }
    handleTextChange(event) {
        const config = vscode.workspace.getConfiguration('clojureDelimiterGuard');
        const autoCloseEnabled = config.get('autoClosePairs', true);
        const debounceDelay = config.get('debounceDelay', 50);
        if (!autoCloseEnabled)
            return;
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.processAutoClose(event);
        }, debounceDelay);
    }
    processAutoClose(event) {
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
            for (const [open, close] of Object.entries(this.autoClosePairs)) {
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
    }
    dispose() {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
    }
}
function activate(context) {
    console.log('Clojure Delimiter Guard is now active!');
    const bracketMatcher = new BracketMatcher();
    const autoCloser = new AutoCloser();
    // Register for text changes and cursor movement
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        bracketMatcher.updateDecorations(activeEditor);
    }
    const textChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            bracketMatcher.updateDecorations(editor);
            autoCloser.handleTextChange(event);
        }
    });
    const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.textEditor) {
            bracketMatcher.updateDecorations(event.textEditor);
        }
    });
    const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            bracketMatcher.updateDecorations(editor);
        }
    });
    // Cleanup on deactivation
    context.subscriptions.push({
        dispose: () => {
            bracketMatcher.dispose();
            autoCloser.dispose();
        }
    });
    context.subscriptions.push(textChangeDisposable, selectionChangeDisposable, editorChangeDisposable);
}
function deactivate() {
    // Cleanup handled by subscription dispose
}
//# sourceMappingURL=extension.js.map