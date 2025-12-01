const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const path = require('path');

module.exports = withModuleFederationPlugin({
  name: 'customers',
  filename: 'remoteEntry.js',
  exposes: {
    './Component': './src/app/customers.component.ts',
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    '@angular/cdk': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    '@angular/cdk/scrolling': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  },
});

module.exports.resolve = {
  alias: {
    '@host/model': path.resolve(__dirname, '../host-app/src/app/model'),
    '@host/services': path.resolve(__dirname, '../host-app/src/app/services'),
  },
};