const Dotenv = require('dotenv-webpack')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/bch-wallet/'
    : '/',
  outputDir: 'docs',
  configureWebpack: {
    plugins: [new Dotenv()]
  }
}