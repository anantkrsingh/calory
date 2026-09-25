// iOS 27 SDK refuses to launch apps without the UIScene lifecycle, and Expo 57's
// template doesn't adopt it yet. AppDelegate still creates the window and starts
// React Native; this SceneDelegate attaches that window to the scene and forwards
// scene events back to AppDelegate so Expo subscribers / RCTLinkingManager keep working.
// Drop this plugin once Expo's template ships its own SceneDelegate.
const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

const SCENE_DELEGATE = `
// @scene-delegate
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  private var app: UIApplication { UIApplication.shared }
  private var appDelegate: UIApplicationDelegate? { app.delegate }

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let window = (appDelegate as? AppDelegate)?.window else { return }
    window.windowScene = windowScene
    window.makeKeyAndVisible()
    self.window = window

    // ponytail: cold-start URLs are forwarded as events, not launchOptions, so Linking.getInitialURL() may miss them.
    self.scene(scene, openURLContexts: connectionOptions.urlContexts)
    connectionOptions.userActivities.forEach { self.scene(scene, continue: $0) }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
      options[.sourceApplication] = context.options.sourceApplication
      options[.annotation] = context.options.annotation
      _ = appDelegate?.application?(app, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = appDelegate?.application?(app, continue: userActivity, restorationHandler: { _ in })
  }

  func sceneDidBecomeActive(_ scene: UIScene) { appDelegate?.applicationDidBecomeActive?(app) }
  func sceneWillResignActive(_ scene: UIScene) { appDelegate?.applicationWillResignActive?(app) }
  func sceneWillEnterForeground(_ scene: UIScene) { appDelegate?.applicationWillEnterForeground?(app) }
  func sceneDidEnterBackground(_ scene: UIScene) { appDelegate?.applicationDidEnterBackground?(app) }
}
`;

module.exports = function withSceneDelegate(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return config;
  });

  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('with-scene-delegate: expected a Swift AppDelegate');
    }
    if (!config.modResults.contents.includes('// @scene-delegate')) {
      config.modResults.contents += SCENE_DELEGATE;
    }
    return config;
  });
};
