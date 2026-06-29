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

## 🔄 Recent Architecture Changes (Session Summary)

**Major refactor completed**: Implemented 4 deep modules for robust state management and timer handling.

**What Changed**:
1. **WorkoutPlayback** (new) — State machine owning all execution state, timer lifecycle, and results
2. **WorkoutConfigManager** (new) — Configuration management with silent validation (replaces 14 callbacks)
3. **EffortScale** (new) — Pure utility functions for effort scaling
4. **ResultCalculator** (new) — Pure functions for result aggregation
5. **Timer display** — Now shows **cumulative total** time (never resets between steps)
6. **Button sequence** — Fixed to bookend pattern: START (once) → NEXT (all steps) → FINISH (last step)
7. **Results calculation** — Now uses `workoutStartTime` to calculate actual total time

**Why These Changes**:
- **Testability**: Deep modules with small interfaces are easier to test without React
- **Timer reliability**: Owned by WorkoutPlayback eliminates React dependency array bugs
- **State machine**: Clear state transitions prevent invalid button/timer combinations
- **Silent validation**: Invalid operations ignored (not thrown), preventing crashes
- **Cumulative timer**: Shows user's actual workout duration from START to FINISH

**Files Modified**:
- New: `src/domain/workout-playback.ts`, `workout-config-manager.ts`, `effort-scale.ts`, `result-calculator.ts`
- New: `src/hooks/use-workout-config.ts`
- Updated: `src/app/index.tsx` (uses new WorkoutConfigManager), `src/app/workout.tsx` (uses WorkoutPlayback)

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
Core data structures and types:
- **`types.ts`** — Core types: `Workout`, `WorkoutStep`, `WorkoutConfig`, `WorkoutResult`, `StationId`, `CardioType`, `EffortScale`, `PairingRule`, `PresetId`
- **`stations.ts`** — Station definitions (ski-erg, sled-push, rowing, etc.) with reps/distance data
- **`cardio.ts`** — Cardio type definitions (run, bike, ski-erg, rower)
- **`presets.ts`** — Difficulty presets (beginner/intermediate/advanced) with effort scales and station count ranges
- **`generate-workout.ts`** — Creates randomized workout sequences from a `WorkoutConfig` using Fisher-Yates shuffle, effort scaling
- **`workout-store.ts`** — Simple singleton for persisting current workout (used to pass workout from home → workout screen)

#### Deep Module 1: WorkoutPlayback (State Machine) (`src/domain/workout-playback.ts`)
**Owns**: Complete workout execution state, timer lifecycle, step progression, and results calculation.

**Interface** (small, simple):
- `constructor(workout: Workout)` — Initialize with a workout
- `get state: WorkoutState` — Immutable snapshot of current state
- `get totalElapsedSeconds: number` — Total elapsed time since workout start
- `startStep(): void` — Begin current step, start timer
- `advanceStep(): void` — Move to next step, auto-start timer for non-final steps
- `finishWorkout(): void` — End workout, calculate results
- `canAdvance(): boolean` — Guard check for advancing
- `isOnLastStep(): boolean` — Check if on final step
- `cleanup(): void` — Stop timer on unmount

**Implementation** (deep, complex):
- Timer lifecycle management (setInterval cleanup)
- Step completion timestamp tracking
- Result calculation (split times, totals)
- State machine logic (prevents invalid transitions)

**Critical Details**:
- Timer owned by WorkoutPlayback, not React — eliminates dependency array issues
- `elapsedSeconds` is per-step; use `totalElapsedSeconds` for display timer
- `advanceStep()` automatically starts next step's timer (keeps isRunning=true for bookend pattern)
- Results calculated from `workoutStartTime` and completion timestamps

#### Deep Module 2: WorkoutConfigManager (Configuration) (`src/domain/workout-config-manager.ts`)
**Owns**: All configuration state, validation rules, and preset application.

**Interface** (uniform, simple):
- `constructor(initialConfig?: Partial<WorkoutConfig>)` — Initialize with optional config
- `get config: WorkoutConfig` — Deep snapshot with spread arrays
- `get validationError: string | null` — Current validation error
- `get isValid: boolean` — Is config valid?
- `updateConfig(field, value): void` — Update single field with validation
- `toggleStation(stationId): void` — Toggle station (silently rejects if invalid)
- `toggleCardioType(cardioType): void` — Toggle cardio type (silently rejects if invalid)
- `applyPreset(presetId): void` — Apply preset, sets default 'run' cardio
- `reset(): void` — Reset to defaults
- `getValidationError(config): string | null` — Pure function for testing configs

**Implementation** (deep, defensive):
- Validation rules (3+ stations, 1+ cardio type)
- Preset expansion logic
- Silent failure pattern (invalid operations ignored, not thrown)
- Deep array spreading for immutable snapshots

**Critical Details**:
- Initializes with INTERMEDIATE preset by default (5 stations, 'run' cardio)
- `getValidationError()` is pure — used internally and for testing hypothetical configs
- All toggles test before committing: won't allow operations that violate constraints

#### Module 3: EffortScale (Utility) (`src/domain/effort-scale.ts`)
Pure functions for effort scaling:
- `getMultiplier(scale: EffortScale): number` — Returns multiplier (1.0, 0.5, 0.25)
- `applyScale(value: number, scale: EffortScale): number` — Apply scale with rounding
- `getScaleLabel(scale: EffortScale): string` — Human label for scale

**Scaling rules**:
- 'full' (1.0x) — 100% of metrics
- 'half' (0.5x) — 50% of metrics
- 'quarter' (0.25x) — 25% of metrics
- **Rounding**: `Math.ceil((value * multiplier) / 5) * 5` (rounds to nearest 5)

#### Module 4: ResultCalculator (Pure Functions) (`src/domain/result-calculator.ts`)
Pure functions for aggregating workout results:
- `calculateLapTimes(workout, completionTimestamps): LapTime[]` — Compute per-step split times
- `aggregateMetrics(steps): { totalReps, totalDistance }` — Sum metrics (cardio distances only)
- `finalizeResult(completions, aggregates, totalTime): WorkoutResult` — Package final result

**Critical Details**:
- No side effects — pure input → output
- Cardio distances included, station distances excluded from totals
- Split times calculated as time between consecutive step completions

#### React Configuration Hook (`src/hooks/use-workout-config.ts`)
Wraps `WorkoutConfigManager` for React:
- State: `config` and re-render trigger
- Methods: All `WorkoutConfigManager` methods proxied
- Error handling: Catches and logs invalid operations
- Re-render forcing: Uses dummy `setTick()` pattern

#### Audio (`src/utils/timer-alert.ts`)
- `configureTimerAlertAudio()` — Initializes audio system
- `playTimerCompleteAlert(audioPlayer)` — Plays timer completion sound (timer-complete.wav)

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
1. User configures workout in home screen (`index.tsx`) via `useWorkoutConfig()` hook (wraps `WorkoutConfigManager`)
2. On "Generate", config is passed to `generateWorkout()` which creates a randomized `Workout` object
3. Workout is stored via `setCurrentWorkout()` (singleton in `workout-store.ts`)
4. Navigation to `/workout` screen, which retrieves it via `getCurrentWorkout()`
5. Workout screen creates `WorkoutPlayback` instance to own execution state and timing
6. `WorkoutPlayback` manages step-by-step progression and calculates results
7. On completion, `clearCurrentWorkout()` cleans up the singleton

This pattern avoids route params or context for large objects while keeping state simple and testable.

### State Management
**Configuration** (`index.tsx`):
- `WorkoutConfigManager` class owns config state, validation, and presets
- `useWorkoutConfig()` hook provides React interface to the manager
- State updates via `updateConfig()`, `toggleStation()`, `toggleCardioType()`, `applyPreset()`

**Playback** (`workout.tsx`):
- `WorkoutPlayback` class owns timer, step progression, and results
- Single instance per workout session (created on mount, cleaned up on unmount)
- State accessed via immutable `playback.state` snapshot
- Timer ticks via `setInterval` owned by `WorkoutPlayback` (not React)
- Display updates via dummy `setTick()` state in component (forces re-render every 1s)

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
   │  └─ Shows **TOTAL elapsed time** in MM:SS format (never resets, runs from 0:00 to finish)
   │
   └─ Button workflow (CRITICAL - Bookend Pattern):
      ├─ Initial state: isRunning = false, currentStepIndex = 0
      │  ├─ Button label: **"START"** (only appears here)
      │  └─ Timer display: 0:00
      │
      ├─ After START pressed:
      │  ├─ isRunning = true, workoutStartTime recorded
      │  ├─ Button label changes to **"NEXT"** immediately
      │  ├─ Timer: increments 0:01, 0:02, 0:03... continuously (cumulative total)
      │  └─ Step 1 begins execution
      │
      ├─ After each NEXT pressed (steps 2 through N-1):
      │  ├─ Step completion recorded (for split times)
      │  ├─ currentStepIndex increments
      │  ├─ Button stays **"NEXT"** (doesn't reset to START)
      │  ├─ Timer continues counting (0:15, 0:16, 0:17...)
      │  ├─ Next step auto-starts (isRunning stays true)
      │  └─ Split time calculated from last completion to now
      │
      ├─ On last step (Step N-1):
      │  ├─ Button label changes from "NEXT" to **"FINISH"**
      │  ├─ Timer still running and counting
      │  └─ User can continue or press FINISH
      │
      └─ After FINISH pressed (on last step):
         ├─ isFinished = true
         ├─ All step completions recorded
         ├─ Results calculated with **total time = elapsed time from START to FINISH**
         └─ Navigate to results screen

   **Button Sequence for 10-step workout**: START → NEXT → NEXT → NEXT → NEXT → NEXT → NEXT → NEXT → NEXT → FINISH

3. RESULTS SCREEN (src/app/workout.tsx)
   ├─ Display **Total Time** (cumulative from START to FINISH, e.g., "5:42")
   ├─ Display **Split Times** for each step (per-step times between progressions)
   ├─ Display **Total Reps** (sum of all station reps)
   ├─ Display **Total Distance** (sum of cardio distances only)
   ├─ Share results option
   └─ "NEW WORKOUT" button
      └─ Clear workout singleton and navigate back to HOME SCREEN

```

---

## 🏗️ Four Deep Modules Architecture

### Module 1: WorkoutPlayback (State Machine)
**File**: `src/domain/workout-playback.ts`

**Responsibility**: Owns complete workout execution state, timer lifecycle, step progression, and results calculation.

**State Machine Flow**:
1. `startStep()` → Records workout start time (first call only), starts 1-second timer interval, sets isRunning=true
2. `advanceStep()` → Records step completion, stops current timer, increments step index, auto-starts next step's timer
3. On final step: `advanceStep()` sets isFinished=true, stops timer, calls `finishWorkout()`

**Public API**:
- `state: WorkoutState` — Immutable snapshot (currentStepIndex, currentStep, isRunning, isFinished, progress, workoutResult)
- `totalElapsedSeconds: number` — Total time from workout start to now (use for display timer)
- `startStep(): void` — Begin current step, start timer
- `advanceStep(): void` — Move to next step, auto-start timer for non-final steps, record completion
- `finishWorkout(): void` — End workout, calculate results
- `canAdvance(): boolean` — Is advancing allowed?
- `isOnLastStep(): boolean` — On final step?
- `cleanup(): void` — Stop timer on unmount

**Critical Implementation Details**:
- Timer lifecycle owned by WorkoutPlayback (setInterval), not React — eliminates dependency issues
- `elapsedSeconds` is per-step and resets; use `totalElapsedSeconds` for display timer
- Results calculated from `workoutStartTime` to `Date.now()` at finish time
- `advanceStep()` keeps isRunning=true for non-final steps (bookend pattern: START...NEXT...FINISH)
- Step completion times tracked in Map for split time calculation

**DO NOT**:
- ❌ Use `elapsedSeconds` for display timer — use `totalElapsedSeconds`
- ❌ Create multiple WorkoutPlayback instances per session — one per workout
- ❌ Assume isRunning changes on advanceStep() — it stays true except on last step

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

### 1. Using `elapsedSeconds` for Display Timer
**Problem**: Timer resets between steps, should show cumulative total
**Cause**: `elapsedSeconds` tracks current step only
**Fix**: Use `playback.totalElapsedSeconds` instead for display, not `state.elapsedSeconds`

### 2. Button Sequence Breaking (Shows START on Every Step)
**Problem**: Button shows "START" for every step instead of bookend pattern
**Cause**: `advanceStep()` not auto-starting next step's timer, or setting isRunning=false
**Fix**: `advanceStep()` must call `startTimer()` for non-final steps, keep isRunning=true

### 3. Results Total Time Wrong
**Problem**: Results show only last step's time, not total workout time
**Cause**: `calculateResults()` using `elapsedSeconds` instead of workoutStartTime
**Fix**: Calculate total as `Math.floor((Date.now() - this.workoutStartTime) / 1000)`

### 4. Timer Not Incrementing
**Problem**: Timer shows 0:00 and doesn't increment
**Cause**: Component not re-rendering every second
**Fix**: Use `setTick(prev => prev + 1)` in 1-second interval AND in button press handler

### 5. Button Click Not Reflecting State Change
**Problem**: User clicks button, state changes in WorkoutPlayback but UI doesn't update
**Cause**: Component not re-rendering after button press
**Fix**: Must call `setTick()` in handleButtonPress to force immediate re-render

### 6. Config Corruption on Invalid Toggle
**Problem**: User tries to remove only cardio type, app crashes or state corrupts
**Cause**: Validation not run before modification, or invalid state applied
**Fix**: WorkoutConfigManager tests new state before committing, silently rejects invalid toggles

### 7. Split Times All 00:00
**Problem**: Results show zero split times for all steps
**Cause**: Step completion times not recorded, or recorded incorrectly
**Fix**: Ensure `recordStepCompletion()` called in `advanceStep()` for each step completed

### 8. Configuration Not Persisting
**Problem**: User selects stations, they deselect on next render
**Cause**: Config getter returning references instead of copies
**Fix**: Config getter must spread arrays: `{ ...config, selectedStations: [...stations], selectedCardioTypes: [...cardioTypes] }`

---

## 🔧 For Next Session: Quick Checklist

**CRITICAL: Test the complete workflow before making ANY changes.**

Start `npm run web` and verify (on a fresh test):

**Home Screen**:
- [ ] Loads with Intermediate preset (5 stations, "run" cardio)
- [ ] Can toggle stations/cardio types without errors
- [ ] "Generate Workout" button enabled when 3+ stations + 1+ cardio selected

**Workout Playback** (button sequence is CRITICAL):
- [ ] Initial button shows **"START"** (only once)
- [ ] Clicking START → button immediately changes to **"NEXT"**
- [ ] Timer starts from 0:00 and increments 0:01, 0:02, 0:03...
- [ ] Clicking NEXT → step advances, button stays **"NEXT"**
- [ ] Timer continues counting (0:05, 0:06...) **does NOT reset**
- [ ] Repeat NEXT through all intermediate steps
- [ ] On last step → button changes to **"FINISH"**
- [ ] Clicking FINISH → navigate to results screen

**Results Screen**:
- [ ] Total Time displays and matches final timer value
- [ ] Split times show per-step times (not all 00:00)
- [ ] Total Reps and Total Distance displayed
- [ ] "NEW WORKOUT" button returns to home screen

**Code Quality**:
- [ ] `npm run lint` = 0 errors
- [ ] `npx tsc --noEmit` = 0 errors
- [ ] No console errors or warnings

**IF ANY FAIL**: Do NOT proceed with feature changes — diagnose and fix the broken workflow first. Common issues:
- Timer resetting? → Check `totalElapsedSeconds` in display, not `elapsedSeconds`
- Button showing START twice? → Check `advanceStep()` auto-starts next timer
- Results time wrong? → Check `calculateResults()` uses `workoutStartTime`, not `elapsedSeconds`
- Split times zero? → Check `recordStepCompletion()` called in `advanceStep()`
