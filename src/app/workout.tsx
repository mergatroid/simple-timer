/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, react-hooks/refs */
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, Share, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { Share2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { WorkoutStepDisplay } from '@/components/workout-step-display';
import { WorkoutList } from '@/components/workout-list';
import { Spacing } from '@/constants/theme';
import { clearCurrentWorkout, getCurrentWorkout } from '@/domain/workout-store';
import { WorkoutPlayback } from '@/domain/workout-playback';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/utils/workout-timer';
import { formatWorkoutForSharing, formatGeneratedWorkoutForSharing, formatCompletionMetric } from '@/utils/share-workout';

export default function WorkoutScreen() {
  const theme = useTheme();
  const workout = getCurrentWorkout();
  const [playback, setPlayback] = useState<WorkoutPlayback | null>(null);
  const [, setTick] = useState(0); // Force re-render on timer tick
  const buttonScaleRef = useRef(new Animated.Value(1));
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize playback state machine on mount
  useEffect(() => {
    if (workout) {
      const pb = new WorkoutPlayback(workout);
      setPlayback(pb);

      // Force re-render every second to show timer updates
      const interval = setInterval(() => {
        setTick(prev => prev + 1);
      }, 1000);
      timerIntervalRef.current = interval;

      return () => {
        pb.cleanup();
        if (interval) clearInterval(interval);
      };
    }
  }, [workout]);

  // Animate button on state changes
  useEffect(() => {
    if (!playback) return;

    Animated.sequence([
      Animated.timing(buttonScaleRef.current, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleRef.current, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [playback?.state.isRunning, playback?.state.currentStepIndex]);

  if (!workout || !playback) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText type="title">No workout loaded</ThemedText>
        <Pressable onPress={() => router.replace('/')}>
          <ThemedText type="smallBold">Go Back</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  const state = playback.state;
  const { currentStep, isFinished, progress, elapsedSeconds, isRunning, workoutResult } = state;

  const handleEndWorkout = () => {
    clearCurrentWorkout();
    router.back();
  };

  const handleShare = async () => {
    if (!workoutResult) return;
    try {
      await Share.share({
        message: formatWorkoutForSharing(workoutResult),
        title: 'wodfish Workout Results',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleShareWorkout = async () => {
    if (!workout) return;
    try {
      await Share.share({
        message: formatGeneratedWorkoutForSharing(workout),
        title: 'wodfish Workout',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleButtonPress = () => {
    try {
      // Check current playback state, not stale closure variable
      if (!playback.state.isRunning) {
        // Start the current step
        playback.startStep();
      } else {
        // Advance to next step (or finish if on last)
        if (playback.isOnLastStep()) {
          playback.finishWorkout();
        } else {
          playback.advanceStep();
        }
      }
      // Force re-render immediately after state change
      setTick(prev => prev + 1);
    } catch (error) {
      console.error('Workout action failed:', error);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={[styles.safeAreaInner, { overflow: 'visible' }]} edges={['top']}>
        {currentStep && !isFinished && (
          <View style={[styles.stickyTimerContainer, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timerLabel}>
              Time Elapsed
            </ThemedText>
            <ThemedText type="title" style={styles.timerDisplay}>
              {formatTime(elapsedSeconds)}
            </ThemedText>
          </View>
        )}
      </SafeAreaView>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {isFinished ? (
          <ScrollView contentContainerStyle={styles.finishContainer} showsVerticalScrollIndicator={false}>
            <ThemedText type="title" style={styles.finishTitle}>
              Complete
            </ThemedText>
            {workoutResult && (
              <View style={styles.resultsSummary}>
                <View style={styles.resultRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Total Time
                  </ThemedText>
                  <ThemedText type="subtitle" style={{ fontWeight: '600' }}>
                    {formatTime(workoutResult.totalTimeSeconds)}
                  </ThemedText>
                </View>
                {workoutResult.totalDistance > 0 && (
                  <View style={styles.resultRow}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Total Distance
                    </ThemedText>
                    <ThemedText type="subtitle" style={{ fontWeight: '600' }}>
                      {workoutResult.totalDistance}m
                    </ThemedText>
                  </View>
                )}
                {workoutResult.totalReps > 0 && (
                  <View style={styles.resultRow}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Total Reps
                    </ThemedText>
                    <ThemedText type="subtitle" style={{ fontWeight: '600' }}>
                      {workoutResult.totalReps}
                    </ThemedText>
                  </View>
                )}

                {/* Split Times */}
                {workoutResult.completions.length > 0 && (
                  <>
                    <ThemedText
                      type="smallBold"
                      themeColor="textSecondary"
                      style={styles.splitsHeader}
                    >
                      SPLITS
                    </ThemedText>
                    {workoutResult.completions.map((completion) => {
                      const metric = formatCompletionMetric(completion);
                      return (
                        <View key={completion.stepId} style={styles.splitRow}>
                          <ThemedText type="small" themeColor="text" style={styles.splitCol1}>
                            {completion.label}
                          </ThemedText>
                          <ThemedText type="small" themeColor="text" style={styles.splitCol2}>
                            {metric}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary" style={styles.splitCol3}>
                            {formatTime(completion.lapTimeSeconds)}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </>
                )}
              </View>
            )}
            <View style={styles.buttonRow}>
              <Pressable
                onPress={handleShare}
                style={[
                  styles.finishButton,
                  styles.shareButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderWidth: 1,
                    borderColor: theme.accent,
                  },
                ]}
              >
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  Share
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  clearCurrentWorkout();
                  router.replace('/');
                }}
                style={[
                  styles.finishButton,
                  styles.newWorkoutButton,
                  {
                    backgroundColor: theme.accent,
                  },
                ]}
              >
                <ThemedText type="smallBold" themeColor="accentText">
                  New Workout
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <>
            {currentStep && (
              <>
                {/* Scrollable Content */}
                <ScrollView
                  style={styles.workoutView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Progress Header */}
                  <View style={styles.header}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', flex: 1 }}>
                      Step {state.currentStepIndex + 1} of {workout.totalSteps}
                    </ThemedText>
                    <Pressable onPress={handleShareWorkout} style={styles.shareIconButton}>
                      <Share2 size={20} color={theme.text} />
                    </Pressable>
                  </View>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: theme.backgroundElement,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: theme.accent,
                          width: `${progress * 100}%`,
                        },
                      ]}
                    />
                  </View>

                  {/* Current Step Display */}
                  <WorkoutStepDisplay step={currentStep} variant="current" />

                  {/* Control Button */}
                  <Animated.View style={{ transform: [{ scale: buttonScaleRef.current }] }}>
                    <Pressable
                      onPress={handleButtonPress}
                      disabled={false}
                      style={[
                        styles.nextButton,
                        {
                          backgroundColor: isRunning
                            ? theme.accent
                            : theme.backgroundElement,
                          ...(isRunning && {
                            borderWidth: 0,
                          }),
                          ...(!isRunning && {
                            borderWidth: 2,
                            borderColor: theme.accent,
                          }),
                        },
                      ]}
                    >
                      <ThemedText
                        type="smallBold"
                        style={{ color: isRunning ? theme.accentText : theme.accent }}
                      >
                        {!isRunning
                          ? 'START'
                          : playback.isOnLastStep()
                            ? 'FINISH'
                            : 'NEXT'}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>

                  {workout.steps.length > 0 && (
                    <View style={styles.upcomingSection}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.upcomingHeader}>
                        WORKOUT
                      </ThemedText>
                      <WorkoutList steps={workout.steps} currentIndex={state.currentStepIndex} />
                    </View>
                  )}

                  <Pressable
                    onPress={handleEndWorkout}
                    style={[
                      styles.endButton,
                      {
                        backgroundColor: theme.backgroundElement,
                      },
                    ]}
                  >
                    <ThemedText type="small" themeColor="textSecondary">
                      End Workout
                    </ThemedText>
                  </Pressable>
                </ScrollView>
              </>
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const MONOSPACE_FONT = 'Courier New';

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  safeAreaInner: {
    flex: 0,
    overflow: 'visible',
  },
  container: {
    flex: 1,
  },
  workoutView: {
    flex: 1,
    zIndex: 0,
  },
  stickyTimerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    marginTop: Spacing.four,
    paddingVertical: Spacing.three,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  header: {
    marginBottom: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareIconButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  timerContainer: {
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.one,
    minHeight: 160,
  },
  timerLabel: {
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  timerDisplay: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  upcomingSection: {
    flex: 1,
    marginVertical: Spacing.one,
    minHeight: 100,
  },
  upcomingHeader: {
    marginBottom: Spacing.two,
  },
  upcomingList: {
    flex: 1,
  },
  moreSteps: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontStyle: 'italic',
  },
  nextButton: {
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
  },
  endButton: {
    paddingVertical: Spacing.two,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  finishContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.six,
  },
  finishTitle: {
    marginBottom: Spacing.four,
    textAlign: 'center',
    fontSize: 28,
  },
  resultsSummary: {
    width: '100%',
    marginBottom: Spacing.six,
    gap: Spacing.one,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  splitsHeader: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  splitCol1: {
    flex: 1,
    fontFamily: MONOSPACE_FONT,
  },
  splitCol2: {
    width: 80,
    textAlign: 'right',
    fontFamily: MONOSPACE_FONT,
  },
  splitCol3: {
    width: 60,
    textAlign: 'right',
    fontFamily: MONOSPACE_FONT,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  finishButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButton: {
    flex: 1,
  },
  newWorkoutButton: {
    flex: 1,
  },
});
