/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */
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
import { useTheme } from '@/hooks/use-theme';
import { useWorkoutPlayer } from '@/hooks/use-workout-player';
import { useWorkoutTimer } from '@/hooks/use-workout-timer';
import { formatTime } from '@/utils/workout-timer';
import { formatWorkoutForSharing, formatGeneratedWorkoutForSharing } from '@/utils/share-workout';
import { WorkoutResult } from '@/domain/types';

export default function WorkoutScreen() {
  const theme = useTheme();
  const workout = getCurrentWorkout();
  const [workoutResult, setWorkoutResult] = useState<WorkoutResult | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const stepTimesRef = useRef<{ stepId: string; timestamp: number }[]>([]);
  const workoutStartTimeRef = useRef<number>(0);
  const buttonScaleRef = useRef(new Animated.Value(1)).current;
  const currentIndexRef = useRef(0);

  // Initialize hooks unconditionally
  const workoutPlayer = useWorkoutPlayer(workout || { steps: [], totalSteps: 0, id: '', generatedAt: 0 });

  const timer = useWorkoutTimer();

  const { currentStep, isFinished, progress, currentIndex, advance } = workoutPlayer;
  const { isRunning } = timer;

  // Track current index in ref for reliable onClick access
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Clear advancing flag when step changes
  useEffect(() => {
    setIsAdvancing(false);
  }, [currentIndex]);

  // Animate button when state changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(buttonScaleRef, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleRef, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isRunning, currentIndex, buttonScaleRef]);

  // Calculate results when workout finishes
  useEffect(() => {
    if (isFinished && !workoutResult && workout) {
      // Use timer's elapsed seconds to match what user sees on display
      const totalTimeSeconds = timer.elapsedSeconds;
      let totalReps = 0;
      let totalDistance = 0;

      // Calculate split times between steps
      const completions = workout.steps.map((step, index) => {
        if (step.unit === 'reps') totalReps += step.value;
        // Only count cardio distances, not station distances
        if (step.unit === 'm' && step.kind === 'cardio') totalDistance += step.value;

        const completion = stepTimesRef.current[index];
        let lapTimeSeconds = 0;

        if (completion) {
          // For first step, calculate from workout start
          // For subsequent steps, calculate from previous step's completion
          const previousCompletion = index === 0
            ? workoutStartTimeRef.current
            : stepTimesRef.current[index - 1]?.timestamp;

          if (previousCompletion) {
            lapTimeSeconds = Math.round((completion.timestamp - previousCompletion) / 1000);
          }
        }

        return {
          stepId: step.id,
          label: step.label,
          kind: step.kind,
          lapTimeSeconds,
          reps: step.unit === 'reps' ? step.value : undefined,
          distance: step.unit === 'm' ? step.value : undefined,
        };
      });

      const result: WorkoutResult = {
        completions,
        totalTimeSeconds,
        totalReps,
        totalDistance,
        stationLapTimes: {},
      };

      setWorkoutResult(result);
    }
  }, [isFinished, workoutResult, workout]);

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText type="title">No workout loaded</ThemedText>
        <Pressable onPress={() => router.replace('/')}>
          <ThemedText type="smallBold">Go Back</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }


  const handleEndWorkout = () => {
    clearCurrentWorkout();
    router.back();
  };

  const handleShare = async () => {
    if (!workoutResult) return;
    try {
      await Share.share({
        message: formatWorkoutForSharing(workoutResult),
        title: 'WODFather Workout Results',
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
        title: 'WODFather Workout',
      });
    } catch (error) {
      console.error('Share failed:', error);
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
              {formatTime(timer.elapsedSeconds)}
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
                      const metric = completion.reps ? `${completion.reps} reps` : completion.distance ? `${completion.distance}m` : '';
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
                  setWorkoutResult(null);
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
                    Step {currentIndex + 1} of {workout.totalSteps}
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
              {(() => {
                const isStart = !isRunning;
                const isFinish = isRunning && currentIndex === workout.totalSteps - 1;
                const isInverted = isStart || isFinish;

                return (
                  <Animated.View style={{ transform: [{ scale: buttonScaleRef }] }}>
                    <Pressable
                      onPress={() => {
                        if (isAdvancing) return; // Prevent double-clicks

                        if (!isRunning) {
                          // Not started yet - start the timer
                          const now = Date.now();

                          if (!workoutStartTimeRef.current) {
                            workoutStartTimeRef.current = now;
                          }
                          timer.start();
                        } else {
                          // Already running - record completion time and advance
                          const now = Date.now();
                          const stepIdx = currentIndexRef.current;

                          if (currentStep) {
                            stepTimesRef.current[stepIdx] = {
                              stepId: currentStep.id,
                              timestamp: now,
                            };
                          }

                          // Stop timer if on last step
                          const isLastStep = stepIdx === workout.totalSteps - 1;
                          if (isLastStep) {
                            timer.pause();
                          }

                          // Prevent further clicks until state updates
                          setIsAdvancing(true);
                          advance();
                        }
                      }}
                      disabled={isAdvancing}
                      style={[
                        styles.nextButton,
                        {
                          backgroundColor: isAdvancing ? theme.backgroundElement : (isInverted ? theme.backgroundElement : theme.accent),
                          opacity: isAdvancing ? 0.5 : 1,
                          ...(isInverted && !isAdvancing && {
                            borderWidth: 2,
                            borderColor: theme.accent,
                          }),
                        },
                      ]}
                    >
                      <ThemedText
                        type="smallBold"
                        style={{ color: isInverted ? theme.accent : theme.accentText }}
                      >
                        {isStart
                          ? 'START'
                          : isFinish
                            ? 'FINISH'
                            : 'NEXT'}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                );
              })()}

              {workout.steps.length > 0 && (
                <View style={styles.upcomingSection}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.upcomingHeader}>
                    WORKOUT
                  </ThemedText>
                  <WorkoutList steps={workout.steps} currentIndex={currentIndex} />
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
    fontFamily: 'Courier New',
  },
  splitCol2: {
    width: 80,
    textAlign: 'right',
    fontFamily: 'Courier New',
  },
  splitCol3: {
    width: 60,
    textAlign: 'right',
    fontFamily: 'Courier New',
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
