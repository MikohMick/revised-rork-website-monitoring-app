
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver to ignore Replit's internal modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ignore Replit's internal modules that cause resolution errors
config.resolver.blacklistRE = /__replco/;

module.exports = config;
