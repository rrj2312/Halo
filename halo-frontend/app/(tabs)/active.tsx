import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState, useRef } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { useJourney } from '@/contexts/JourneyContext';
import { Audio } from 'expo-av';
import { BASE_URL } from '@/config';

type ThreatLevel = 'safe' | 'warning' | 'danger';

export default function ActiveMonitoringScreen() {
  const { colors } = useTheme();
  const { selectedMode, addTranscript, transcriptHistory } = useJourney();
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('safe');
  const [reason, setReason] = useState('Monitoring environment...');
  const [flaggedPhrase, setFlaggedPhrase] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const duration = threatLevel === 'safe' ? 2000 : threatLevel === 'warning' ? 1000 : 500;
    scale.value = withRepeat(withTiming(1.1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
    opacity.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [threatLevel]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Request mic permission and start analysis loop
  useEffect(() => {
    startMonitoring();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync();
    };
  }, []);

  const startMonitoring = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert('Microphone needed', 'HALO needs mic access to monitor threats.');
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    runAnalysisCycle(); // run immediately on start
    intervalRef.current = setInterval(runAnalysisCycle, 30000); // then every 30s
  };

  const runAnalysisCycle = async () => {
    try {
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      // Record for 25 seconds
      await new Promise((resolve) => setTimeout(resolve, 25000));

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      // Read the file and send to backend
      const formData = new FormData();
      formData.append('audio', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);
      formData.append('mode', selectedMode || 'cab');

      const response = await fetch(`${BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // Update UI
      const level = data.threat_level?.toLowerCase() as ThreatLevel;
      setThreatLevel(level || 'safe');
      setReason(data.reason || '');
      setFlaggedPhrase(data.flagged_phrase || null);

      // Add to live feed
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      addTranscript({ time, text: data.transcript || 'Audio analyzed.', threat_level: level });

      // Navigate to danger screen if DANGER
      if (level === 'danger') {
        router.push('/danger');
      }

    } catch (error) {
      console.log('Analysis cycle error:', error);
      // Keep monitoring even if one cycle fails
    }
  };

  const handleEndJourney = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      await fetch(`${BASE_URL}/journey/end`, { method: 'POST' });
      const res = await fetch(`${BASE_URL}/report`);
      const reportData = await res.json();
      router.push('/timeline');
    } catch (e) {
      router.push('/timeline');
    }
  };

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'safe': return colors.grey;
      case 'warning': return colors.amber;
      case 'danger': return colors.red;
    }
  };

  const getThreatText = () => {
    switch (threatLevel) {
      case 'safe': return 'SAFE';
      case 'warning': return 'WARNING';
      case 'danger': return 'DANGER';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.modeTitle, { color: colors.text }]}>
          {(selectedMode || 'CAB').toUpperCase()} MODE — ACTIVE
        </Text>

        <View style={styles.meterContainer}>
          <Animated.View style={[styles.meterOuter, animatedStyle]}>
            <Svg width="240" height="240" style={styles.meterSvg}>
              <Circle cx="120" cy="120" r="100" stroke={getThreatColor()} strokeWidth="12" fill="none" />
            </Svg>
          </Animated.View>
          <View style={styles.meterCenter}>
            <Text style={[styles.threatText, { color: getThreatColor() }]}>{getThreatText()}</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.pulseDot, { backgroundColor: colors.amber }]} />
          <Text style={[styles.statusText, { color: colors.amber }]}>HALO Active</Text>
        </View>

        {reason ? (
          <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{reason}</Text>
        ) : null}

        {flaggedPhrase ? (
          <View style={[styles.flaggedBadge, { backgroundColor: colors.cardBackground, borderColor: colors.amber }]}>
            <Text style={[styles.flaggedText, { color: colors.amber }]}>⚡ {flaggedPhrase}</Text>
          </View>
        ) : null}

        <View style={[styles.transcriptContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.transcriptTitle, { color: colors.text }]}>Live Feed</Text>
          {transcriptHistory.length === 0 ? (
            <Text style={[styles.transcriptText, { color: colors.textSecondary }]}>Listening...</Text>
          ) : (
            [...transcriptHistory].reverse().map((msg, index) => (
              <View key={index} style={styles.transcriptItem}>
                <Text style={[styles.transcriptTime, { color: colors.textSecondary }]}>{msg.time}</Text>
                <Text style={[styles.transcriptText, { color: colors.text }]}>{msg.text}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.analyzeLabel, { color: colors.textSecondary }]}>
          Analyzing every 30 seconds...
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.endButton, { borderColor: colors.amber }]} onPress={handleEndJourney}>
          <Text style={[styles.endButtonText, { color: colors.amber }]}>END JOURNEY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 120 },
  modeTitle: { fontFamily: 'Sora-Bold', fontSize: 16, letterSpacing: 2, textAlign: 'center', marginBottom: 40 },
  meterContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32, height: 280 },
  meterOuter: { position: 'absolute' },
  meterSvg: { transform: [{ rotate: '-90deg' }] },
  meterCenter: { alignItems: 'center', justifyContent: 'center' },
  threatText: { fontFamily: 'Sora-Bold', fontSize: 32, letterSpacing: 2 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  reasonText: { fontFamily: 'DMSans-Regular', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  flaggedBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, alignSelf: 'center', marginBottom: 16 },
  flaggedText: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  transcriptContainer: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 10 },
  transcriptTitle: { fontFamily: 'Sora-SemiBold', fontSize: 14, marginBottom: 8 },
  transcriptItem: { flexDirection: 'row', gap: 12 },
  transcriptTime: { fontFamily: 'DMSans-Regular', fontSize: 12, width: 48 },
  transcriptText: { fontFamily: 'DMSans-Regular', fontSize: 12, flex: 1 },
  analyzeLabel: { fontFamily: 'DMSans-Regular', fontSize: 12, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40 },
  endButton: { height: 56, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  endButtonText: { fontFamily: 'Sora-Bold', fontSize: 16, letterSpacing: 1 },
});