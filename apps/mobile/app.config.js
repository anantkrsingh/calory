const base = require('./app.json');

const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;

module.exports = () => {
  const config = { ...base.expo };

  if (facebookAppId && facebookClientToken) {
    config.plugins = [
      ...config.plugins,
      [
        'react-native-fbsdk-next',
        {
          appID: facebookAppId,
          clientToken: facebookClientToken,
          displayName: 'Fitness Tracker',
          scheme: `fb${facebookAppId}`,
        },
      ],
    ];
  }

  return config;
};
