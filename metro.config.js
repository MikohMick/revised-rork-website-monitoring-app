
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enhanced resolver configuration
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// More comprehensive blacklist for Replit's internal modules
config.resolver.blacklistRE = /__replco|\.replit|replit\.nix/;

// Reduce file watching to prevent ENOSPC errors
config.watchFolders = [];
config.resolver.useWatchman = false;

// Transformer settings to reduce memory usage
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
