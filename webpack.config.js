'use strict';

module.exports = {
    devtool: 'inline-source-map',
    entry: './src/app.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                enforce: 'pre',
                loader: 'tslint-loader',
                options: { failOnHint: false, configFile: './tslint.json' }
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js' ]
    }
};

