# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**wodfish** (codebase: **glent**) is a Hyrox-focused workout generator for iOS, Android, and web. It generates randomized station-based workouts with configurable difficulty levels and cardio pairings, then plays back the workout step-by-step with audio alerts.

Users can:
- Choose difficulty presets (beginner/intermediate/advanced)
- Select from 8 Hyrox stations (ski-erg, sled-push, rowing, burpees, etc.)
- Configure cardio pairings (run, bike, etc.) and pairing rules
- Generate a randomized workout sequence
- Play through the workout with per-step timers and audio cues

Key tech stack:
- **Expo 56.0.12** — Universal React Native development platform
- **React 19** with TypeScript
- **React Native** for mobile UI
- **Expo Router** for file-based routing
- **React Native Reanimated** for animations
- **expo-audio** for timer alerts

## Development Commands

### Installation and Setup
```bash
npm install                 # Install dependencies
npx expo lint             # Run ESLint (requires setup via `npx expo lint` if not configured)
```

### Running the App
```bash
npm start                 # Start Expo development server (interactive menu for iOS/Android/web)
npm run ios              # Start iOS simulator directly
npm run android          # Start Android emulator directly
npm run web              # Start web server (localhost:8081)
```

### Project Management
```bash
npm run reset-project    # Reset project state, moves starter code to app-example/
```

### Debugging
- Use Expo Go app on physical device (scan QR code from `npm start`)
- Development builds offer more features than Expo Go sandbox

## Architecture Overview

### Core Application Flow

The app is a **workout generator and player** built with Expo Router file-based routing:
- `src/app/_layout.tsx` — Root layout providing theme context
- `src/app/index.tsx` — Home screen (workout configuration and generation)
- `src/app/workout.tsx` — Workout playback screen (displays workout steps sequentially)

**Workflow**: User configures workout settings → system generates a random workout → navigates to workout screen → player displays each step with timer

### Key Modules

#### Domain Model (`src/domain/`)
Defines the core data structures and business logic for workouts:
- **`types.ts`** — Core types: `Workout`, `WorkoutStep`, `WorkoutConfig`, `StationId`, `CardioType`, `EffortScale`, `PairingRule`, `PresetId`
- **`stations.ts`** — Station definitions (ski-erg, sled-push, rowing, etc.) with reps/distance data
- **`cardio.ts`** — Cardio type definitions (run, bike, ski-erg, rower)
- **`presets.ts`** — Difficulty presets (beginner/intermediate/advanced) with effort scales and station count ranges
- **`generate-workout.ts`** — Creates randomized workout sequences from a `WorkoutConfig` using Fisher-Yates shuffle, effort scaling
- **`workout-store.ts`** — Simple singleton for persisting current workout (used to pass workout from home → workout screen)

#### Workout Configuration Hook (`src/hooks/use-wod-workout.ts`)
Manages user-configurable workout settings:
- State: `config` (stations, cardio types, effort, pairing rule, distance mode)
- Methods: `applyPreset()`, `toggleStation()`, `toggleCardioType()`, `generateWorkout()`
- Validation: Enforces minimum 3 stations, 1 cardio type

#### Workout Playback Hook (`src/hooks/use-workout-player.ts`)
Tracks progress through a generated workout:
- Manages: `currentIndex`, derives `currentStep`, `remainingSteps`, `isFinished`, `progress`
- Methods: `advance()` (next step), `restart()`

#### Timer Logic (`src/utils/workout-timer.ts`)
Low-level countdown utilities:
- `tickTimer()` — Decrements timer by 1 second
- `parseDurationInput()` — Parses user input (supports "60" or "1:30" format)
- `formatTime()` — Formats seconds to "mm:ss" display
- `getTimerStatus()` — Determines timer state (idle/running/paused/finished)

#### Timer Hook (`src/hooks/use-workout-timer.ts`)
Encapsulates timer state and control for a single step:
- Manages: `durationSeconds`, `remainingSeconds`, `isRunning`, `hasStarted`
- Returns: `status`, control methods (`start`, `pause`, `reset`), duration setters
- Handles completion callback via `onCompleteRef` (prevents memory leaks)
- 1-second interval-based countdown

#### Audio (`src/utils/timer-alert.ts`)
- `configureTimerAlertAudio()` — Initializes audio system
- `playTimerCompleteAlert()` — Plays timer completion sound (timer-complete.wav)

#### Theme System (`src/hooks/use-theme.ts`, `src/constants/theme.ts`)
- `useTheme()` — Returns current theme colors based on device color scheme
- **Colors object** contains light/dark mode palettes with keys: `text`, `background`, `backgroundElement`, `backgroundSelected`, `textSecondary`
- **Spacing** — Consistent scale (half=2, one=4, two=8, three=16, four=24, five=32, six=64)
- Platform-specific fonts via `Fonts` constant

### Component Structure

**Themed Components** (wrap React Native components with theme context)
- `<ThemedView>` — Theme-aware View with optional semantic type ("backgroundElement")
- `<ThemedText>` — Theme-aware Text with optional type ("title", "smallBold", etc.)

**Layout Components**
- `<AnimatedSplashOverlay>` — Animated splash screen
- `<SafeAreaView>` — Native safe area handling

**Workout-Specific UI Components**
- `<StationCard>` — Displays a station option (name, rep ranges)
- `<PresetChip>` — Selectable preset button (beginner/intermediate/advanced)
- `<CardioChip>` — Selectable cardio type button
- `<DistancePicker>` — UI for selecting run distance (fixed or range mode)
- `<WorkoutStepDisplay>` — Displays current workout step during playback

**Legacy Components**
- `<Collapsible>` — Expandable content component
- `<ExternalLink>` — Web link component

### Platform-Specific Files

Expo supports platform-specific implementations via `.web.tsx` and `.native.tsx` suffixes:
- `src/components/animated-icon.tsx` / `.web.tsx`
- `src/components/app-tabs.tsx` / `.web.tsx`
- `src/hooks/use-color-scheme.ts` / `.web.ts`

These files are loaded automatically based on the target platform.

## Key Configuration Files

- **`app.json`** — Expo app manifest (name, icons, plugins, experiments)
- **`tsconfig.json`** — Path aliases (`@/*` → `src/*`, `@/assets/*` → `assets/*`)
- **`expo-env.d.ts`** — Auto-generated type definitions

## Important Patterns & Conventions

### Workout Data Flow
The app follows a **configuration → generation → playback** pattern:
1. User configures workout in home screen (`index.tsx`) via `useWodWorkout()` hook
2. On "Generate", the hook's `generate()` method creates a `Workout` object with randomized steps
3. Workout is stored via `setCurrentWorkout()` (singleton in `workout-store.ts`)
4. Navigation to `/workout` screen, which retrieves it via `getCurrentWorkout()`
5. Workout player (`useWorkoutPlayer()`) manages step-by-step progression
6. On completion, `clearCurrentWorkout()` cleans up the singleton

This pattern avoids route params or context for large objects while keeping state simple.

### State Management
- Hook-based (`useState`, `useCallback`, `useRef`)
- Refs used to prevent stale closures in callbacks (see `onCompleteRef` in timer hook)
- Workout-level state managed in `useWodWorkout()` and `useWorkoutPlayer()`

### Randomization
- Workouts use **Fisher-Yates shuffle** for station randomization (see `generate-workout.ts`)
- Station selection and effort scaling applied per configuration and preset

### Input Validation
- `parseDurationInput()` returns `null` on invalid input; check before using
- Workout generation validates: minimum 3 stations, 1 cardio type (checked before `generate()` call)
- Timer always enforces minimum 1 second via `Math.max(1, ...)`

### Styling
- StyleSheet-based (not Tailwind/NativeWind)
- Use `theme` object from `useTheme()` hook for runtime colors
- Spacing constants (`Spacing.one`, etc.) for consistent margins/padding

### Audio Setup
- `configureTimerAlertAudio()` must be called once on mount (see workout.tsx useEffect)
- Audio player passed to alert function: `playTimerCompleteAlert(alertPlayer)`

## Expo Version

This project uses **Expo SDK v56** (pinned versions). Before making changes:
- **Read versioned docs** at https://docs.expo.dev/versions/v56.0.0/
- Expo introduces breaking changes frequently between major versions

Key experiments enabled in app.json:
- `typedRoutes: true` — Type-safe routing with Expo Router
- `reactCompiler: true` — React 19 compiler optimizations

## Building and Publishing

EAS (Expo Application Services) configured with projectId in app.json:
- Use `eas build` for native builds
- Use `eas submit` for app store submission
- See https://docs.expo.dev/eas/ for details

## Testing

No unit tests currently configured. The domain logic (especially `generate-workout.ts` effort scaling and randomization) is a good candidate for Jest tests.

To set up testing:
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/react
npx expo lint  # May help set up Jest config
```

Good test targets:
- `applyEffortScale()` in `generate-workout.ts` (effort multiplier logic)
- `generateWorkout()` (workout sequencing and validation)
- `useWodWorkout()` hook (state updates, validation rules)

Refer to https://docs.expo.dev/develop/unit-testing/ for Expo Jest setup.
