const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

const isDev = process.argv.some(v => v.includes('webpack-dev-server'));

module.exports =
{
	// This is the "main" file which should include all other modules
	entry: './src/main.ts',
	// Where should the compiled file go?
	output:
	{
		publicPath: '/',
		filename: '[name].[contenthash].js'
	},
	mode: isDev ? 'development' : 'production',
	devtool: isDev ? '': 'eval',
	resolve: {
		alias: {
			// '@': path.resolve(__dirname, 'src'),
			vue: '@vue/runtime-dom',
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
					}
				],
			},
		],
	},
	plugins:
	[
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: 'public/index.html',
			favicon: 'public/favicon.ico',
		}),
		new VueLoaderPlugin(),
	],
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
				},
			},
		},
	},
	devServer: {
		historyApiFallback: true,
	},
};
