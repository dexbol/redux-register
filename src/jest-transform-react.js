import {transformAsync} from '@babel/core';

export default {
    processAsync(sourceText, sourcePath, options) {
        return transformAsync(sourceText, {
            sourceMaps: true,
            sourceFileName: sourcePath,
            presets: [['@babel/preset-react', {runtime: 'automatic'}]]
        });
    }
};
