//
//  AppDelegate.swift
//  Filimo
//
//  Created by Saeed Taheri on 2/26/18.
//  Copyright © 2018 Filimo. All rights reserved.
//

import UIKit
import AVFoundation
import TVMLKit
import TVServices

final class AppDelegate: UIResponder, UIApplicationDelegate, TVApplicationControllerDelegate {
  var window: UIWindow?
  var appController: TVApplicationController?
  var appControllerContext: TVApplicationControllerContext?

  // MARK: Javascript Execution Helper

  func executeRemoteMethod(_ methodName: String, completion: @escaping (Bool) -> Void) {
    appController?.evaluate(
      inJavaScriptContext: { (context: JSContext) in
        let appObject : JSValue = context.objectForKeyedSubscript("App")

        if appObject.hasProperty(methodName) {
          appObject.invokeMethod(methodName, withArguments: [])
        }
      },
      completion: completion
    )
  }

  // MARK: UIApplicationDelegate

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    window = UIWindow(frame: UIScreen.main.bounds)

    do {
      try AVAudioSession.sharedInstance().setCategory(.playback)
    } catch {
      print("Setting category to AVAudioSessionCategoryPlayback failed.")
    }

    appControllerContext = TVApplicationControllerContext()

    if let javaScriptURL = URL(string: Config.tvBootURL) {
      appControllerContext?.javaScriptApplicationURL = javaScriptURL
    }

    appControllerContext?.launchOptions["jsBaseURL"] = Config.tvBaseURL
    appControllerContext?.launchOptions["baseURL"] = Config.baseURL
    appControllerContext?.launchOptions["appName"] = Config.appNameFa

    if let launchOptions = launchOptions {
      for (kind, value) in launchOptions {
        appControllerContext?.launchOptions[kind.rawValue] = value
      }
    }

    appControllerContext?.supportsPictureInPicturePlayback = true

    setupTVApplicationController()

    return true
  }

  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    appController?.evaluate(
      inJavaScriptContext: { context in
        if let appObj = context.globalObject.objectForKeyedSubscript("App") {
          if appObj.hasProperty("onOpenURL") {
            appObj.invokeMethod("onOpenURL", withArguments: [url.absoluteString])
          }
        }
      },
      completion: nil
    )

    return true
  }

  func applicationWillResignActive(_ application: UIApplication) {
    executeRemoteMethod("onWillResignActive") { _ in
    }
  }

  func applicationDidEnterBackground(_ application: UIApplication) {
    executeRemoteMethod("onDidEnterBackground") { _ in
    }

    TVTopShelfContentProvider.topShelfContentDidChange()
  }

  func applicationWillEnterForeground(_ application: UIApplication) {
    executeRemoteMethod("onWillEnterForeground") { _ in
    }
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    executeRemoteMethod("onDidBecomeActive") { _ in
    }
  }

  func applicationWillTerminate(_ application: UIApplication) {
    executeRemoteMethod("onWillTerminate") { _ in
    }
  }

  // MARK: TVApplicationControllerDelegate

  func appController(_ appController: TVApplicationController, didFinishLaunching options: [String: Any]?) {
    print("\(#function) invoked with options: \(options ?? [:])")
  }

  func appController(_ appController: TVApplicationController, didFail error: Error) {
    print("\(#function) invoked with error: \(error)")

    let title = NSLocalizedString(
      "error_launching_app",
      comment: "Alert title shown when launching TVML app was problematic"
    )

    let alertController = UIAlertController(
      title: title,
      message: LocalizableError.message(for: error),
      preferredStyle: .alert
    )

    alertController.addAction(
      UIAlertAction(
        title: NSLocalizedString(
          "retry",
          comment: "Button title for trying again"
        ),
        style: .default,
        handler: { _ in
          self.setupTVApplicationController()
        }
      )
    )

    self.appController?.navigationController.present(alertController, animated: true, completion: nil)
  }

  func appController(_ appController: TVApplicationController, didStop options: [String: Any]?) {
    print("\(#function) invoked with options: \(options ?? [:])")
  }

  private func setupTVApplicationController() {
    guard let context = appControllerContext else { return }
    appController = TVApplicationController(context: context, window: window, delegate: self)
  }

  func appController(_ appController: TVApplicationController, evaluateAppJavaScriptIn jsContext: JSContext) {
    jsContext.setObject(
      SubtitleProviderWrapper.self,
      forKeyedSubscript: "SubtitleProvider" as NSString
    )
  }
}
