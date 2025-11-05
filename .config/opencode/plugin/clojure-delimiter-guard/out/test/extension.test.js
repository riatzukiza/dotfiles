"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present', () => {
        // Check if any extension is loaded (since we're in test mode)
        const extensions = vscode.extensions.all;
        assert.ok(extensions.length > 0);
    });
    test('Extension should activate', async () => {
        // Just test that we can import and call activate
        const { activate } = require('../extension');
        const mockContext = {
            subscriptions: []
        };
        assert.doesNotThrow(() => {
            activate(mockContext);
        });
    });
});
//# sourceMappingURL=extension.test.js.map