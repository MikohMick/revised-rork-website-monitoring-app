
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enhanced resolver configuration
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// More comprehensive blacklist for Replit's internal modules and problematic packages
config.resolver.blacklistRE = /__replco|\.replit|replit\.nix|@expo\/vector-icons|expo-haptics|expo-web-browser|@react-native\/debugger-frontend/;

// Completely disable file watching to prevent ENOSPC errors
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

// Comprehensive blocklist to prevent file watching issues
config.resolver.blockList = [
  /node_modules\/@expo\/vector-icons/,
  /node_modules\/expo-haptics/,
  /node_modules\/expo-web-browser/,
  /node_modules\/@react-native\/debugger-frontend/,
  /node_modules\/react-native.*\/dist/,
  /node_modules\/.*\/third-party/,
  /node_modules\/.*\/front_end/,
  /\.replit/,
  /replit\.nix/,
  /__replco/,
];

// Additional settings to reduce Metro's file system load
config.resetCache = true;
config.maxWorkers = 1;

// Disable Metro's file map to prevent excessive file watching
if (config.resolver.platforms.includes('web')) {
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native': 'react-native-web',
  };
}

module.exports = config;
