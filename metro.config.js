
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enhanced resolver configuration
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// More comprehensive blacklist for Replit's internal modules and problematic packages
config.resolver.blacklistRE = /__replco|\.replit|replit\.nix|@expo\/vector-icons|expo-haptics|expo-web-browser/;

// Drastically reduce file watching to prevent ENOSPC errors
config.watchFolders = [];
config.resolver.useWatchman = false;
config.watcher = {
  healthCheck: {
    enabled: false,
  },
  additionalExts: [], // Minimize watched file extensions
};

// Transformer settings to reduce memory usage
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Reduce Metro's file system scanning
config.resolver.blockList = [
  /node_modules\/@expo\/vector-icons/,
  /node_modules\/expo-haptics/,
  /node_modules\/expo-web-browser/,
  /\.replit/,
  /replit\.nix/,
  /__replco/,
];

module.exports = config;
