const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const path = require('path');

module.exports = {
    ...withModuleFederationPlugin({
        name: 'bookings',

        library: { type: 'module' },

        exposes: {
            './Component': './src/app/bookings.component.ts',
        },

        remotes: {
            'host-app': 'http://localhost:3000/remoteEntry.js',
        },

        shared: {
            ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
        },
    }),
    experiments: {
        topLevelAwait: true,
        outputModule: true,
    },
    resolve: {
        alias: {
            '@host/model': path.resolve(__dirname, '../host-app/src/app/model'),
            '@host/services': path.resolve(__dirname, '../host-app/src/app/services'),
        },
    },
};