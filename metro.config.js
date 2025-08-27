
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Completely disable all file watching
config.watchFolders = [];
config.resolver.useWatchman = false;

// Disable Metro's file map entirely
config.fileMap = {
  roots: [__dirname],
  extensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  platforms: ['web'],
  providesModuleNodeModules: [],
  hasteImplModulePath: undefined,
  skipMatching: true,
};

// Force Metro to not watch any files
config.watcher = {
  healthCheck: {
    enabled: false,
  },
  additionalExts: [],
  ignored: [
    /node_modules\/.*/,
    /\.git\/.*/,
    /\.expo\/.*/,
  ],
};

// Comprehensive blocklist
config.resolver.blockList = [
  /node_modules\/@expo\/vector-icons/,
  /node_modules\/expo-haptics/,
  /node_modules\/expo-web-browser/,
  /node_modules\/@react-native\/debugger-frontend/,
  /node_modules\/react-native-svg\/android/,
  /node_modules\/.*\/android/,
  /node_modules\/.*\/ios/,
  /node_modules\/.*\/dist/,
  /\.replit/,
  /replit\.nix/,
];

// Minimal resolver settings
config.resolver.platforms = ['web'];
config.resolver.resolverMainFields = ['browser', 'main'];

// Disable cache and reset
config.resetCache = true;
config.maxWorkers = 1;

module.exports = config;
