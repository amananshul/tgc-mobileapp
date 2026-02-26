This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# TGC Supabase Auth + Onboarding MVP

## Required env keys

Mobile app (JS runtime):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GOOGLE_WEB_CLIENT_ID` (required for Google Sign-In on Android / Supabase Id Token flow)
- `GOOGLE_IOS_CLIENT_ID` (required for iOS Google Sign-In)

API (`tgc-express/api/.env`):

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_MEDIA_BUCKET`

## Run locally (end-to-end)

1. Start Postgres and the API (`tgc-express/api`)
2. Run Prisma migration + generate
   - `npx prisma migrate deploy`
   - `npx prisma generate`
3. Install mobile dependencies and iOS pods
   - `cd tgc-frontend && npm install`
   - `cd ios && pod install`
4. Start Metro
   - `npx react-native start --reset-cache`
5. Run app
   - Android: `npx react-native run-android`
   - iOS: `npx react-native run-ios`

## Supabase Google Auth setup (Bare React Native)

This app uses `@react-native-google-signin/google-signin` + `supabase.auth.signInWithIdToken(...)` (no browser redirect flow).

In Supabase:

1. Enable Google provider in `Authentication -> Providers -> Google`
2. Add your Google OAuth client credentials in Supabase provider settings
3. Ensure the Google project includes:
   - Android app client (package name + SHA-1/SHA-256)
   - iOS app client (bundle id)
   - Web client (used as `GOOGLE_WEB_CLIENT_ID`)
4. Use the Web Client ID in the mobile app env as `GOOGLE_WEB_CLIENT_ID`
5. Use the iOS client ID in the mobile app env as `GOOGLE_IOS_CLIENT_ID`
6. iOS native: add the reversed iOS client ID as a URL scheme in `Info.plist` (`CFBundleURLTypes`)

Note: This bare RN implementation does not require OAuth redirect URLs in-app because Google Sign-In returns an `idToken` directly, which is exchanged with Supabase.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
