const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Function to obfuscate a given file
function obfuscateFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(
        code,
        {
            controlFlowFlattening: false,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: false,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false,
            debugProtectionInterval: 0,
            disableConsoleOutput: false,
            domainLock: [],
            domainLockEnabled: true,
            domainLockRedirectUrl: "about:blank",
            exclude: [],
            forceTransformStrings: [],
            identifierNamesCache: null,
            identifierNamesGenerator: "hexadecimal",
            identifiersDictionary: [],
            identifiersPrefix: "",
            ignoreImports: false,
            inputFileName: "",
            log: false,
            numbersToExpressions: false,
            optionsPreset: "default",
            renameGlobals: false,
            renameProperties: false,
            renamePropertiesMode: "safe",
            reservedNames: [],
            reservedStrings: [],
            seed: 0,
            selfDefending: false,
            simplify: true,
            sourceMap: false,
            sourceMapBaseUrl: "",
            sourceMapFileName: "",
            sourceMapSourcesMode: "sources-content",
            splitStrings: false,
            splitStringsChunkLength: 10,
            splitStringsChunkLengthEnabled: false,
            stringArray: true,
            stringArrayCallsTransform: false,
            stringArrayCallsTransformThreshold: 0.5,
            stringArrayEncoding: ['none'],
            stringArrayEncodingEnabled: true,
            stringArrayIndexShift: true,
            stringArrayIndexesType: ['hexadecimal-number'],
            stringArrayRotate: true,
            stringArrayRotateEnabled: true,
            stringArrayShuffle: true,
            stringArrayShuffleEnabled: true,
            stringArrayThreshold: 0.75,
            stringArrayThresholdEnabled: true,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersCount: 1,
            stringArrayWrappersParametersMaxCount: 2,
            stringArrayWrappersType: "variable",
            target: "browser",
            transformObjectKeys: false,
            unicodeEscapeSequence: false
        }
    );
    const obfuscatedCode = obfuscationResult.getObfuscatedCode();
    fs.writeFileSync(filePath, obfuscatedCode, 'utf8');
    console.log(`Obfuscated: ${filePath}`);
}

// Function to recursively obfuscate all JavaScript files in a folder, ignoring 'cocos-js' folders
function obfuscateAllJsFilesInFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err.message}`);
            return;
        }
        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats of file: ${err.message}`);
                    return;
                }
                if (stats.isDirectory()) {
                    if (file !== 'cocos-js' && file != 'src') {
                        obfuscateAllJsFilesInFolder(filePath);
                    }
                } else if (path.extname(filePath) === '.js') {
                    obfuscateFile(filePath);
                }
            });
        });
    });
}

// Function to get sibling folders at the same level as the script, excluding the script itself and other scripts at the same level
function getSiblingFolders(currentPath) {
    const parentFolder = currentPath;
    fs.readdir(parentFolder, (err, files) => {
        if (err) {
            console.error(`Error reading parent directory: ${err.message}`);
            return;
        }
        files.forEach((file) => {
            const filePath = path.join(parentFolder, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats of file: ${err.message}`);
                    return;
                }
                if (stats.isDirectory() && file !== path.basename(currentPath) && file !== 'cocos-js' && file != 'src') {
                    obfuscateAllJsFilesInFolder(filePath);
                }
            });
        });
    });
}

// Main script execution
const scriptPath = __dirname + process.argv[2];
getSiblingFolders(scriptPath);
