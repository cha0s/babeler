const config = require('@flecks/core/build/.eslint.defaults.js');

config.rules['babel/no-unused-expressions'] = 0;
config.rules['import/no-extraneous-dependencies'] = 0;

module.exports = config;

