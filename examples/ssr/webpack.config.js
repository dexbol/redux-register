import webpack from 'webpack';

export default {
    devtool: false,
    mode: 'development',
    entry: './src/client.js',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react']
                    }
                }
            }
        ]
    },
    plugins: [
        new webpack.IgnorePlugin({
            checkResource(resource) {
                return resource.indexOf('serverstate.js') > 0;
            }
        })
    ]
};
