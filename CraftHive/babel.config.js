// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Do NOT include react-native-reanimated/plugin here
    // It is only needed if you use Reanimated's animated hooks directly
    // CraftHive does not use Reanimated hooks — only basic Animated API
    plugins: [],
  };
};