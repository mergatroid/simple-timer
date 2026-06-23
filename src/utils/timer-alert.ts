import { Alert, Platform } from 'react-native';
import { setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export async function configureTimerAlertAudio() {
  await setAudioModeAsync({
    playsInSilentMode: true,
  });
}

export function playTimerCompleteAlert(player: AudioPlayer) {
  player.seekTo(0);
  player.play();

  if (Platform.OS !== 'web') {
    Alert.alert("Time's up!", 'Your rest interval is complete.');
  }
}
