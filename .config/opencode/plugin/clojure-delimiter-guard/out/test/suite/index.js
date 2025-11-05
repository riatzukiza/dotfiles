"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = require("path");
const Mocha = require("mocha");
function run() {
    // Create mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000
    });
    const testsRoot = path.resolve(__dirname, '..');
    return new Promise((resolve, reject) => {
        // Manually add test files
        const testFiles = [
            path.resolve(testsRoot, 'extension.test.js')
        ];
        testFiles.forEach(f => mocha.addFile(f));
        try {
            // Run the mocha test
            mocha.run(failures => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                }
                else {
                    resolve();
                }
            });
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    });
}
//# sourceMappingURL=index.js.map