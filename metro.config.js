
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver for web platform
config.resolver.platforms = ['web', 'native', 'ios', 'android'];
config.resolver.alias = {
  'react-native': 'react-native-web',
};

// Add specific resolution for @babel/runtime
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@babel/runtime/')) {
    return {
      filePath: require.resolve(moduleName),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Block problematic Replit imports
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.disableHierarchicalLookup = true;

// Add resolver extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'jsx', 'ts', 'tsx', 'json'];

// Configure transformer
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Prevent ENOSPC error by aggressively limiting file watching
config.watchFolders = [];
config.resolver.useWatchman = false;

// Comprehensive block list to prevent watching unnecessary files
config.resolver.blockList = [
  /\.cache\/.*/,
  /\.bun\/.*/,
  /node_modules\/.*\/android/,
  /node_modules\/.*\/ios/,
  /node_modules\/.*\/\.gradle/,
  /node_modules\/@react-native\/gradle-plugin/,
  /node_modules\/.*\/kotlin/,
  /node_modules\/.*\/java/,
  /node_modules\/.*\/swift/,
  /\.expo\/.*/,
  /\.git\/.*/,
  /\.replit/,
  /replit\.nix/,
  // Block Replit devtools to prevent module resolution errors
  /__replco\/.*/,
  /.*__replco.*/,
  /.*\/devtools\/eruda\/.*/,
];

// Disable Metro's built-in file watching to prevent validation warnings
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => middleware,
};

// Disable cache and set minimal workers for Replit environment
config.resetCache = true;
config.maxWorkers = 1;

module.exports = config;
