---
name: mobile-engineering
description: Use this skill for mobile app development with React Native, Flutter, or native (Swift/Kotlin), app store submission, deep linking, push notifications, offline support, and mobile CI/CD. Trigger whenever someone mentions "mobile app", "React Native", "Flutter", "iOS", "Android", "app store", "deep linking", "push notifications", "mobile", "Expo", or "native app".
---

# 26 — Mobile Engineering

## Framework Selection

| Framework | Best For | Performance | Team Skill |
|-----------|---------|-------------|-----------|
| React Native (Expo) | Web team building mobile | Good (90% of native) | JavaScript/TypeScript |
| Flutter | Custom UI, multi-platform (mobile+web+desktop) | Excellent | Dart (learning curve) |
| Swift (iOS) / Kotlin (Android) | Max performance, platform-specific features | Native | Platform specialists |

### Default Recommendation: React Native with Expo
- Fastest time to market for teams with web experience
- Expo managed workflow eliminates native build complexity
- Over-the-air updates (EAS Update) — bypass app store for JS changes
- Native modules available via Expo Modules API when needed

## Project Structure (Expo)
```
src/
├── app/                    # Expo Router (file-based routing)
│   ├── (tabs)/            # Tab navigator group
│   ├── (auth)/            # Auth flow screens
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home screen
├── components/            # Shared UI components
├── hooks/                 # Custom hooks
├── lib/                   # Utilities, API client
├── stores/                # State management (Zustand)
├── constants/             # Colors, dimensions, config
└── assets/                # Images, fonts
```

## Mobile-Specific Concerns

### Offline Support
- Cache critical data locally (MMKV, SQLite, or AsyncStorage)
- Queue mutations when offline, sync when reconnected
- Show clear offline indicator to user
- Handle conflict resolution (last-write-wins or prompt user)

### Push Notifications
- Request permission at contextual moment (not on first launch)
- Store device tokens server-side, handle token refresh
- Support notification categories (actionable notifications)
- Deep link from notification to relevant screen
- Analytics: track open rate, action rate per notification type

### Deep Linking
- Universal Links (iOS) / App Links (Android) for seamless web-to-app
- Custom scheme for development (`myapp://`)
- Handle all deep link routes in navigation config
- Deferred deep linking for users who don't have the app installed yet

### Performance
- Startup time target: < 2 seconds to interactive
- Use `React.memo` and `useMemo` to prevent unnecessary re-renders
- FlatList with `getItemLayout` for long lists (avoid measuring)
- Optimize images: resize before upload, cache aggressively
- Monitor with Flipper or React Native Performance Monitor

## App Store Submission Checklist

### iOS (App Store Connect)
- [ ] App icons: all required sizes (1024x1024 source)
- [ ] Screenshots: 6.7", 6.5", 5.5" (iPhone), 12.9" (iPad if universal)
- [ ] Privacy policy URL
- [ ] App privacy nutrition labels filled
- [ ] Review guidelines compliance check
- [ ] TestFlight beta testing (minimum 1 week)
- [ ] Allow 1-3 days for App Store review

### Android (Google Play Console)
- [ ] App bundle (.aab, not .apk)
- [ ] Store listing: screenshots, feature graphic (1024x500)
- [ ] Content rating questionnaire completed
- [ ] Data safety section filled
- [ ] Target API level meets Google Play requirements
- [ ] Internal testing → Closed beta → Open beta → Production

## Mobile CI/CD
- Use EAS Build (Expo) or Fastlane (native) for automated builds
- Run unit tests + lint on every PR
- Build preview APK/IPA for QA on feature branches
- Auto-submit to TestFlight / Internal Testing on main branch merge
- Production release requires manual approval gate

## External Skills (skills.sh)
```bash
npx skills add expo/skills/building-native-ui
npx skills add expo/skills/native-data-fetching
npx skills add expo/skills/upgrading-expo
npx skills add expo/skills/expo-tailwind-setup
npx skills add expo/skills/expo-deployment
npx skills add expo/skills/expo-cicd-workflows
npx skills add expo/skills/expo-api-routes
npx skills add vercel-labs/agent-skills/vercel-react-native-skills
npx skills add sleekdotdesign/agent-skills/sleek-design-mobile-apps
```
