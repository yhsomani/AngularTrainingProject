const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'host',

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    '@angular/cdk': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    '@angular/cdk/scrolling': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  },
});
