import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { WorkoutStepDisplay } from '@/components/workout-step-display';
import { WorkoutList } from '@/components/workout-list';
import { Spacing } from '@/constants/theme';
import { clearCurrentWorkout, getCurrentWorkout } from '@/domain/workout-store';
import { useTheme } from '@/hooks/use-theme';
import { useWorkoutPlayer } from '@/hooks/use-workout-player';
import { useWorkoutTimer } from '@/hooks/use-workout-timer';
import { formatTime } from '@/utils/workout-timer';
import { formatWorkoutForSharing } from '@/utils/share-workout';
import { WorkoutResult } from '@/domain/types';

export default function WorkoutScreen() {
  const theme = useTheme();
  const workout = getCurrentWorkout();
  const [workoutResult, setWorkoutResult] = useState<WorkoutResult | null>(null);
  const stepTimesRef = useRef<{ stepId: string; timestamp: number }[]>([]);
  const workoutStartTimeRef = useRef<number>(0);

  // Initialize hooks unconditionally
  const workoutPlayer = useWorkoutPlayer(workout || { steps: [], totalSteps: 0, id: '', generatedAt: 0 });

  const timer = useWorkoutTimer();

  const { currentStep, isFinished, progress, currentIndex, advance } = workoutPlayer;


  // Calculate results when workout finishes
  useEffect(() => {
    if (isFinished && !workoutResult && workout) {
      const totalTimeSeconds = Math.round((Date.now() - workoutStartTimeRef.current) / 1000);
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
          if (index === 0) {
            // First step: time from start
            lapTimeSeconds = Math.round((completion.timestamp - workoutStartTimeRef.current) / 1000);
          } else {
            // Subsequent steps: time from previous step
            const prevCompletion = stepTimesRef.current[index - 1];
            if (prevCompletion) {
              lapTimeSeconds = Math.round((completion.timestamp - prevCompletion.timestamp) / 1000);
            }
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

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={[styles.safeAreaInner, { overflow: 'visible' }]} edges={['top']}>
        {currentStep && !isFinished && (
          <View style={[styles.stickyTimerContainer, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.timerLabel}>
              Time Remaining
            </ThemedText>
            <ThemedText type="title" style={styles.timerDisplay}>
              {formatTime(timer.remainingSeconds)}
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
                    {workoutResult.completions.map((completion) => (
                      <View key={completion.stepId} style={styles.splitRow}>
                        <ThemedText type="small" themeColor="text">
                          {completion.label}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {formatTime(completion.lapTimeSeconds)}
                        </ThemedText>
                      </View>
                    ))}
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
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  Step {currentIndex + 1} of {workout.totalSteps}
                </ThemedText>
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
              </View>

              {/* Current Step Display */}
              <WorkoutStepDisplay step={currentStep} variant="current" />

              {/* Control Button */}
              <Pressable
                onPress={() => {
                  if (timer.remainingSeconds === 0) {
                    // Not started yet - start the timer
                    timer.start();
                  } else {
                    // Record completion time before advancing
                    const now = Date.now();
                    // Set start time on first completion
                    if (!workoutStartTimeRef.current) {
                      workoutStartTimeRef.current = now;
                    }
                    stepTimesRef.current[currentIndex] = {
                      stepId: currentStep.id,
                      timestamp: now,
                    };
                    // Already running - advance to next station
                    advance();
                  }
                }}
                style={[
                  styles.nextButton,
                  {
                    backgroundColor: theme.accent,
                  },
                ]}
              >
                <ThemedText type="smallBold" themeColor="accentText">
                  {timer.remainingSeconds === 0
                    ? 'START'
                    : currentIndex === workout.totalSteps - 1
                      ? 'FINISH'
                      : 'NEXT'}
                </ThemedText>
              </Pressable>

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
    gap: Spacing.four,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  splitsHeader: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
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
