import path from 'node:path';
import {fileURLToPath} from 'node:url';

export default {
    printWidth: 80,
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    quoteProps: 'as-needed',
    jsxSingleQuote: false,
    trailingComma: 'none',
    bracketSpacing: false,
    bracketSameLine: true,
    htmlWhitespaceSensitivity: 'ignore',
    arrowParens: 'always',
    requirePragma: false,
    insertPragma: false,
    endOfLine: 'auto',
    plugins: [
        path.join(
            path.dirname(fileURLToPath(import.meta.url)),
            'node_modules',
            'prettier-plugin-jsdoc',
            'dist',
            'index.js'
        )
    ]
};
