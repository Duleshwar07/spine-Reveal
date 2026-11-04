# 🍾 Spin & Reveal

A party game for phones, built with **React Native + Expo**: **spin the bottle, then pick a card**.
It has two game modes and clean card categories for family nights and office get-togethers.

| Mode | How a turn works |
|---|---|
| **Truth or Dare** | The bottle picks a player → they pick a face-down **Truth** or **Dare** card → they do it (✓ Done scores a point) or skip. |
| **Never Have I Ever** | The bottle picks a reader → they pick one of three face-down cards → they read "Never have I ever…" aloud → everyone who *has* done it raises a hand. |

| Category | Audience |
|---|---|
| 👨‍👩‍👧 **Family** | Kid-friendly, all ages |
| 🤝 **Friends** | Silly, easy-going hangout cards |
| 💼 **Office** | Work-safe icebreakers |
| 💞 **Couples** | Sweet and flirty prompts for partners (*Teens & adults*) |
| 🔥 **Intense** | Deep truths and bold dares (*Teens & adults*) |
| 🎲 **Mixed** | Family, Friends and Office cards together |

Family, Friends, Office and Mixed are completely clean. Couples and Intense are spicier, either romantic or deeply personal, but never explicit. The Setup screen marks them with a *Teens & adults* badge.

## Features

- 2–12 players, seated evenly around an animated bottle
- A spin with natural ease-out that always lands clearly on one player and never picks the same player twice in a row
- 3D card-flip reveal that also works on Android
- No repeated cards: each deck goes through every prompt before it reshuffles
- Score badges in Truth or Dare mode
- "Swap card" if a prompt doesn't suit the group
- Free packs, plus premium packs unlocked by a one-time purchase or a rewarded ad
- No image assets in the game UI. Everything is drawn with Views.

## Monetisation

| | |
|---|---|
| 🆓 Free | Family, Friends, Office, Mixed |
| 🔒 Premium packs | Couples, Intense (one-time purchase, or **watch a rewarded ad for 60 minutes of access**) |
| 📺 Ads | Google AdMob interstitial every 5 turns, only between turns |
| 🚫 Remove Ads · 👑 Unlock Everything | One-time purchases |

Purchases go through **RevenueCat** on top of Google Play Billing. The app ships with Google's **test ads**, and purchases are **simulated in development**. For the step-by-step setup with your own AdMob, Play and RevenueCat accounts, see **[MONETIZATION.md](./MONETIZATION.md)**.

> Ads and billing need a **development build**. They don't run in Expo Go. Expo Go still works (`npx expo start --go`): there, ads are skipped and unlocks are simulated.

## Tech stack

- Expo SDK 58 · React Native 0.88 · React 19
- `react-native-safe-area-context`
- `expo-splash-screen` (branded splash) and `expo-build-properties` (release shrinking)
- `react-native-google-mobile-ads` (AdMob with UMP consent), `react-native-purchases` (RevenueCat), `expo-dev-client`
- The built-in `Animated` API (native driver) for the spin and the card flip
- Plain JavaScript with no navigation library. Two screens are switched with state.

## Quick start

Requirements: **Node.js 20+** and the **Expo Go** app on your phone (or an Android emulator or iOS simulator).

```bash
cd spin-and-reveal
npm install            # first time only
npx expo start --go    # Expo Go (ads off, purchases simulated)
npx expo start         # development build (real test ads)
```

- **Phone:** scan the QR code with Expo Go (Android) or the Camera app (iOS).
- **Android emulator:** press `a` in the terminal.
- **iOS simulator (macOS only):** press `i`.
- **Web (optional):** `npx expo install react-dom react-native-web`, then press `w`.

If Expo Go says the SDK version is incompatible, run `npx expo install --fix`. You can also update Expo Go.

## Project structure

```
spin-and-reveal/
├── App.js                     # Root: safe area + switches Setup ⇄ Game
├── index.js                   # Expo entry point
├── app.json                   # App name, package id, icons, splash, build optimisations
├── eas.json                   # EAS build/submit profiles (preview APK, production AAB)
├── PLAYSTORE.md               # Google Play publishing guide + listing text
├── PRIVACY_POLICY.md          # Privacy policy (host it publicly for Play)
├── MONETIZATION.md            # AdMob + Play products + RevenueCat setup
├── assets/                    # App icon, adaptive icon layers, splash
├── store-assets/              # Play Store icon (512) + feature graphic (1024×500)
└── src/
    ├── theme.js               # Colours, player colours, card-type metadata
    ├── data/cards.js          # Categories + all prompts (edit this to add cards)
    ├── monetization/          # config.js (ids/prices), ads.js, purchases.js, context
    ├── utils/deck.js          # Shuffle, no-repeat deck, random player picker
    ├── components/
    │   ├── Bottle.js          # Bottle drawn with Views, rotated by Animated value
    │   ├── SpinCircle.js      # Players around a ring + tappable bottle
    │   ├── CardPicker.js      # Face-down cards to choose from
    │   ├── FlipCard.js        # Flip animation + card faces
    │   └── Button.js
    └── screens/
        ├── SetupScreen.js     # Players, mode, category
        └── GameScreen.js      # Spin → choose → reveal turn loop
```

## Building and publishing

Builds run in the cloud with EAS, so you don't need Android Studio or Xcode. `eas.json` defines two profiles:

| Profile | Output | Use |
|---|---|---|
| `development` | `.apk` (dev client) | Day-to-day development with real test ads |
| `preview` | `.apk` | Install directly on a phone for testing |
| `production` | `.aab` | Upload to Google Play (versionCode goes up automatically) |

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview      # test APK
npx eas-cli@latest build -p android --profile production   # Play Store bundle
```

**For the full Google Play walkthrough, see [PLAYSTORE.md](./PLAYSTORE.md).** It covers accounts, signing, the store listing text, content rating, data safety and the privacy policy.

## Performance and size optimisations

- **The animations run on the native thread** (`useNativeDriver`). The bottle spin and card flip never touch the JS thread, so they stay smooth even on budget phones.
- **Memoized components** (`Bottle`, `SpinCircle`, `CardBack`) and cached seat positions avoid needless re-renders. Event handlers are kept stable with `useCallback`.
- **No image assets inside the app UI.** The bottle and cards are drawn with Views, so the bundle stays small.
- **Release builds are shrunk** through `expo-build-properties`: R8 minification, resource shrinking and PNG crunching.
- **No extra Android permissions requested by the app itself** (`"permissions": []`). The only additions are the ones AdMob and Billing need: internet, network state, advertising ID and billing.
- **Hermes** is the JS engine (Expo's default), which gives fast startup and low memory use.
- **Android back button:** on the game screen it returns to Setup instead of closing the app.

## More

For how to play and how to customise or extend the game, see **[GUIDEME.md](./GUIDEME.md)**.
