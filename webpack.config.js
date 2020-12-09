const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');

const isDev = process.argv.some(v => v.includes('webpack-dev-server'));

module.exports =
{
    // This is the "main" file which should include all other modules
    entry: './src/main.ts',
    // Where should the compiled file go?
    output:
    {
        publicPath: '/',
        filename: '[name].[hash].js',
    },
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? '': 'eval',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['.ts', '.js', '.json'],
    },
    module:
    {
        rules:
        [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                // exclude: /node_modules/,
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options:
                        {
                            name: '[path][name].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    plugins:
    [
        new Dotenv({
            systemvars: true,
        }),
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin({
            __VUE_OPTIONS_API__: false,
            __VUE_PROD_DEVTOOLS__: false,
        }),
        new HtmlWebpackPlugin({
            template: 'public/index.html',
            favicon: 'public/favicon.ico',
        }),
        new VueLoaderPlugin(),
    ],
    devServer: {
        hot: true,
    },
};
