const babel = require('rollup-plugin-babel');
const pkg = require('./package');

const now = new Date();

module.exports = {
  entry: 'src/Plugin.js',
  targets: [{
    dest: 'dist/jquery-gantt.js',
  }],
  format: 'umd',
  moduleName: 'Gantt',
  external: ['jquery'],
  globals: {
    jquery: '$',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup'],
      babelrc: false
    })
  ],
  sourceMap: true,
  banner: `/*!
   * Gantt v${pkg.version}
   * https://github.com/${pkg.repository}
   *
   * Copyright (c) ${now.getFullYear()} ${pkg.author}
   * Released under the ${pkg.license} license
   */
  `,
};
