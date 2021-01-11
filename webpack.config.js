const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const fs = require('fs-extra');
const { checkBrowsers } = require('react-dev-utils/browsersHelper');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

// const webpackDevClientEntry = require.resolve('react-dev-utils/webpackHotDevClient');
// const reactRefreshOverlayEntry = require.resolve('react-dev-utils/refreshOverlayInterop');

const isInteractive = process.stdout.isTTY;
const appPath = path.resolve(__dirname, './');
const appPublic = path.resolve(__dirname, 'public');
const appBuild = path.resolve(__dirname, 'build');
const appHtml = path.resolve(__dirname, 'src/index.html');
const appHtmlts = path.resolve(__dirname, 'src/index');
const assets = path.resolve(__dirname, 'src/assets');

function copyPublicFolder() {
    console.log('------- copying files from public dir to build -------');
    fs.copySync(appPublic, appBuild, {
      dereference: true,
      filter: file => file !== appHtml,
    });
}
module.exports = (env) =>  {
    const isProduction = env.NODE_ENV === 'production';
    const isDevelopment = env.NODE_ENV === 'development';
    const globalConfig = require('./config/config.json')[env.NODE_ENV];
    const localConfig = require('./config/config.local.json')[env.NODE_ENV];
    let envConfig = {
        ...globalConfig
    }
    !isProduction ? envConfig = {...envConfig, ...localConfig} : null;
    isProduction && checkBrowsers(appPath, isInteractive).then(() => {
        copyPublicFolder();
    })
    console.log('=========================', env.NODE_ENV, 'env_var', envConfig)
    return {
        mode: env.NODE_ENV,
        entry:  appHtmlts,
        output: {
            path: appBuild,
            filename: 'bundle.js',
            publicPath: '/'
        },
        devtool: 'source-map',
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    use: {
                        loader: 'babel-loader',
                        query: {compact: false}
                    },
                    exclude: /node-modules/
                },
                {
                    test: /\.tsx?$/,
                    use: [{
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        },
                    }],
                    exclude: /node-modules/
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                    exclude: /node-modules/
                },
                {
                    test: /\.(s[ac]ss)$/i,
                    use: ['style-loader', 'css-loader', 'sass-loader'],
                    exclude: /node-modules/
                },
                {
                    test: /\.(jpe?g|png|gif|woff|woff2|eot|ttf|svg)(\?[a-z0-9=.]+)?$/,
                    use: {
                        loader: 'url-loader',
                        options: {
                            esModule: false
                        }
                    }
                },
                {
                    test: /\.(png|jpeg|gif|svg|jpg)/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: assets + '/images',
                            publicPath: '/images'
                        }
                    }]
                }
                
            ]
        },
        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    // test: /\.tsx(\?.*)?$/i
                    terserOptions: {
                        parse: {
                          ecma: 8,
                        },
                        compress: {
                          ecma: 5,
                          warnings: false,
                          comparisons: false,
                        },
                        mangle: {
                          safari10: true,
                        },
                        output: {
                          ecma: 5,
                          comments: false,
                          ascii_only: true,
                        },
                    },
                    sourceMap: isProduction ? false : true,
                }),
            ],
        },
        resolve: {
            extensions: ['.tsx', 'ts', '.js', '.jsx', '.json', '.css'],
            alias: {
                '~images': path.resolve(__dirname, 'src/assets/images'),
                'Styles': path.resolve(__dirname, 'src/assets/style')
            }
        },
        devServer: {
            historyApiFallback: true,
            compress: true,
            hot: true,
            port: 3000
        },
        devtool: isProduction
            ? 'source-map'
            : 'cheap-module-source-map',
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new HtmlWebPackPlugin({
                template: appHtml
            }),
            new MiniCssExtractPlugin({ // plugin for controlling how compiled css will be outputted and named
                filename: "css/[name].css",
                chunkFilename: "css/[id].css"
            }),
            new webpack.DefinePlugin({
                env_config: JSON.stringify(envConfig)
            })

        ]
    }
}