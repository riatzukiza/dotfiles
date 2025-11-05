import * as path from 'path';
import * as Mocha from 'mocha';

export function run(): Promise<void> {
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
                } else {
                    resolve();
                }
            });
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
}