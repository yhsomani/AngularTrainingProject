const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
    name: 'admin-remote',
    filename: 'remoteEntry.js',
    exposes: {
        './Component': './src/app/admin.component.ts',
    },
    shared: {
        ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    },
});
