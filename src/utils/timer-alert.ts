import { setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export async function configureTimerAlertAudio() {
  await setAudioModeAsync({
    playsInSilentMode: true,
  });
}

export function playTimerCompleteAlert(player: AudioPlayer) {
  player.seekTo(0);
  player.play();
}
