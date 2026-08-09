const { withPodfile } = require('@expo/config-plugins');

module.exports = function withRNFirebase(config) {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    if (!podfile.includes('$RNFirebaseDisableSPM = true')) {
      config.modResults.contents =
        '$RNFirebaseDisableSPM = true\n\n' + podfile;
    }

    return config;
  });
};