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

---

## 🎯 Complete User Workflow (Critical Reference)

### Home Screen → Workout Screen → Results Screen

```
1. HOME SCREEN (src/app/index.tsx)
   ├─ Loads with INTERMEDIATE preset pre-selected
   │  ├─ 5 stations selected
   │  ├─ "run" cardio type selected
   │  ├─ effortScale: 'half'
   │  └─ runDistanceFixed: 400m
   │
   ├─ User can customize:
   │  ├─ Difficulty preset (Beginner/Intermediate/Advanced)
   │  ├─ Individual stations (toggle on/off)
   │  ├─ Cardio types (toggle on/off)
   │  ├─ Metrics scale (Full/1/2/1/4)
   │  ├─ Run distance (Fixed or Range)
   │  └─ Pairing rule (Before/After/Random)
   │
   └─ GENERATE WORKOUT button
      └─ Active when: 3+ stations AND 1+ cardio type selected

2. WORKOUT SCREEN (src/app/workout.tsx)
   ├─ Displays current step with metrics
   ├─ Shows progress: "Step X of Y"
   ├─ TIMER DISPLAY (sticky at top)
   │  └─ Shows time elapsed in MM:SS format
   │
   └─ Button workflow (CRITICAL):
      ├─ Initial state: isRunning = false
      │  ├─ Button label: "START"
      │  └─ Timer display: 0:00
      │
      ├─ After START pressed:
      │  ├─ isRunning = true
      │  ├─ Button label: "NEXT" (or "FINISH" if last step)
      │  ├─ Timer: increments 0:01, 0:02, 0:03... each second
      │  └─ workoutStartTime recorded
      │
      ├─ After NEXT pressed:
      │  ├─ isRunning = false
      │  ├─ Button label: "START"
      │  ├─ Timer resets: 0:00
      │  ├─ currentStepIndex increments
      │  ├─ Step completion recorded
      │  └─ elapsedSeconds reset to 0
      │
      └─ After FINISH pressed (on last step):
         ├─ isFinished = true
         ├─ Results calculated
         └─ Navigate to results screen

3. RESULTS SCREEN
   ├─ Display total time
   ├─ Display split times for each step
   ├─ Share results option
   └─ "NEW WORKOUT" button
      └─ Navigate back to HOME SCREEN

```

---

## 🏗️ Four Deep Modules Architecture

### Module 1: WorkoutPlayback (State Machine)
**File**: `src/domain/workout-playback.ts`

**Responsibility**: Owns complete workout execution state and timing

**Critical Methods**:
- `startStep()` - Starts timer, sets isRunning=true
- `advanceStep()` - Records completion, resets timer, moves to next step
- `finishWorkout()` - Completes entire workout, calculates results

**State Property**: Immutable snapshot with:
- `currentStepIndex` - Which step we're on
- `isRunning` - Is timer active?
- `isFinished` - Is workout complete?
- `elapsedSeconds` - Time elapsed for current step
- `workoutResult` - Final results (null until finished)

**DO NOT**:
- ❌ Call methods that throw errors - they now fail silently
- ❌ Assume isRunning stays true - it resets on advanceStep()
- ❌ Trust elapsedSeconds between renders - use state snapshot

### Module 2: WorkoutConfigManager (Configuration)
**File**: `src/domain/workout-config-manager.ts`

**Responsibility**: Manages all configuration state with validation

**Critical Behavior**:
- Initializes with INTERMEDIATE preset (5 stations, 'run' cardio)
- Validates: 3+ stations AND 1+ cardio type required
- Invalid operations silently ignored (no thrown errors)
- Presets always set cardio type to 'run'

**DO NOT**:
- ❌ Expect errors thrown - operations fail silently
- ❌ Assume state persists after invalid toggle - it doesn't
- ❌ Forget that toggles validate BEFORE applying

### Module 3: ResultCalculator (Pure Functions)
**File**: `src/domain/result-calculator.ts`

**Functions**:
- `calculateLapTimes()` - Computes split time for each step
- `aggregateMetrics()` - Sums reps and distances
- `finalizeResult()` - Packages results for display

**DO NOT**:
- ❌ Call these from component render - use in playback only
- ❌ Forget they're pure - no side effects

### Module 4: EffortScale (Utility)
**File**: `src/domain/effort-scale.ts`

**Functions**:
- `applyScale(value, scale)` - Returns effort-scaled value

**Scaling**:
- 'full' (1.0x) - 100% of metrics
- 'half' (0.5x) - 50% of metrics
- 'quarter' (0.25x) - 25% of metrics
- Rounding: Math.ceil((value * multiplier) / 5) * 5 (round to nearest 5)

---

## ⚠️ Common Pitfalls (AVOID THESE)

### 1. Timer Not Updating
**Problem**: Timer shows 0:00 and doesn't increment
**Cause**: Component not re-rendering every second
**Fix**: Use `setTick(prev => prev + 1)` in 1-second interval AND in button press handler

### 2. Button Not Responding
**Problem**: User clicks START, button stays START, timer doesn't start
**Cause**: Component doesn't re-render after button press
**Fix**: Must call `setTick()` in handleButtonPress to force immediate re-render

### 3. Config Corruption on Invalid Toggle
**Problem**: User tries to remove only cardio type, state gets corrupted
**Cause**: Mutation before validation
**Fix**: Validate BEFORE modifying, only update if validation passes

### 4. Shallow Config Snapshots
**Problem**: Array selections not updating in UI
**Cause**: Config getter returns shallow spread
**Fix**: Must spread arrays too: `{ ...config, selectedStations: [...stations], ... }`

### 5. Validation Errors Silently Breaking
**Problem**: Silent errors mean app appears to do nothing
**Solution**: This is intentional - operations that would make config invalid are simply ignored

---

## 🔧 For Next Session: Quick Checklist

Before making changes, verify:
- [ ] Start `npm run web` and test the FULL workflow (Home → Generate → Play all steps → Results)
- [ ] Timer counts up from 0:00 when START pressed
- [ ] Button changes to NEXT immediately when pressed
- [ ] NEXT resets timer to 0:00
- [ ] On last step, button shows FINISH
- [ ] FINISH shows results with split times
- [ ] "NEW WORKOUT" button goes back home
- [ ] Linting: `npm run lint` = 0 errors
- [ ] TypeScript: `npx tsc --noEmit` = 0 errors

If ANY of the above fail, do NOT proceed with feature changes - fix the broken workflow first.
