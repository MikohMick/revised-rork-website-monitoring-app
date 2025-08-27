
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver for web platform
config.resolver.platforms = ['web', 'native', 'ios', 'android'];
config.resolver.alias = {
  'react-native': 'react-native-web',
};

// Add resolver extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'jsx', 'ts', 'tsx', 'json'];

// Configure transformer
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Prevent ENOSPC error by limiting file watching
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /\.cache\/.*/,
  /node_modules\/.*\/android/,
  /node_modules\/.*\/ios/,
  /node_modules\/.*\/\.gradle/,
  /node_modules\/@react-native\/gradle-plugin/,
  /\.expo\/.*/,
  /\.git\/.*/,
];

// Disable cache and enable Metro server
config.resetCache = true;

module.exports = config;
