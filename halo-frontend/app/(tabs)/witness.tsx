import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Shield, Wifi, WifiOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const EVIDENCE_ID = 'HL-2847';

export default function SilentWitnessScreen() {
  const { colors } = useTheme();
  const [displayedId, setDisplayedId] = useState('');
  const [isOffline] = useState(false);
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= EVIDENCE_ID.length) {
        setDisplayedId(EVIDENCE_ID.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: '#0D0D0F' }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.shieldGlow, animatedGlowStyle]}>
          <View
            style={[
              styles.shieldGlowInner,
              { backgroundColor: colors.amber, opacity: 0.2 },
            ]}
          />
        </Animated.View>

        <View style={styles.shieldContainer}>
          <Shield size={80} color={colors.amber} strokeWidth={2} />
        </View>

        <Text style={[styles.evidenceLabel, { color: colors.textSecondary }]}>
          Evidence ID
        </Text>
        <Text style={[styles.evidenceId, { color: colors.amber }]}>
          {displayedId}
          {displayedId.length < EVIDENCE_ID.length && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>

        <Text style={[styles.statusText, { color: '#FFF8F8' }]}>
          Recording secured. Admissible.
        </Text>

        <View style={styles.statusPills}>
          <View style={[styles.pill, { backgroundColor: 'rgba(245, 166, 35, 0.15)' }]}>
            <View style={[styles.recordingDot, { backgroundColor: colors.red }]} />
            <Text style={[styles.pillText, { color: '#FFF8F8' }]}>Recording</Text>
          </View>

          <View style={[styles.pill, { backgroundColor: 'rgba(245, 166, 35, 0.15)' }]}>
            <Text style={[styles.pillText, { color: '#FFF8F8' }]}>📍 Location Locked</Text>
          </View>

          <View style={[styles.pill, { backgroundColor: 'rgba(245, 166, 35, 0.15)' }]}>
            <Text style={[styles.pillText, { color: '#FFF8F8' }]}>📤 Syncing</Text>
          </View>
        </View>

        {isOffline && (
          <View
            style={[
              styles.offlineIndicator,
              { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
            ]}
          >
            <WifiOff size={16} color="#FFF8F8" />
            <Text style={[styles.offlineText, { color: '#FFF8F8' }]}>
              Stored locally. Will upload on reconnect.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.safeButton, { backgroundColor: colors.green }]}
        >
          <Text style={styles.safeButtonText}>I AM SAFE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  shieldGlow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldGlowInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  shieldContainer: {
    marginBottom: 40,
  },
  evidenceLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  evidenceId: {
    fontFamily: 'Sora-Bold',
    fontSize: 40,
    letterSpacing: 4,
    marginBottom: 16,
  },
  cursor: {
    opacity: 0.8,
  },
  statusText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    marginBottom: 32,
  },
  statusPills: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  offlineText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  safeButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeButtonText: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
    color: '#FFF8F8',
    letterSpacing: 1,
  },
});

