const { withPodfile } = require('@expo/config-plugins');
const appJson = require('./app.json');
const withSceneDelegate = require('./plugins/with-scene-delegate');

function withRNFirebase(config) {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    if (!podfile.includes('$RNFirebaseDisableSPM = true')) {
      config.modResults.contents =
        '$RNFirebaseDisableSPM = true\n\n' + podfile;
    }

    return config;
  });
}

module.exports = () => {
  let config = appJson.expo;

  config = withRNFirebase(config);
  config = withSceneDelegate(config);

  return config;
};