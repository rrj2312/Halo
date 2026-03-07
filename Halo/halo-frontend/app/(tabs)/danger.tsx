import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const alerts = [
  'Alert sent to Sarah Mitchell',
  'SMS delivered',
  'Location shared',
  'Evidence ID attached',
];

export default function DangerAlertScreen() {
  const { colors } = useTheme();
  const [visibleAlerts, setVisibleAlerts] = useState<number[]>([]);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    alerts.forEach((_, index) => {
      setTimeout(() => {
        setVisibleAlerts((prev) => [...prev, index]);
      }, index * 300);
    });

    pulseOpacity.value = withRepeat(
      withTiming(0.85, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedPulseStyle]}>
      <View style={styles.content}>
        <Text style={styles.threatTitle}>THREAT DETECTED</Text>

        <Text style={styles.reasonText}>Route deviation + verbal threat detected</Text>

        <View style={styles.evidenceContainer}>
          <Text style={styles.evidenceLabel}>Evidence ID</Text>
          <Text style={styles.evidenceId}>HL-2847</Text>
        </View>

        <View style={styles.alertsList}>
          {alerts.map((alert, index) => (
            <AlertItem
              key={index}
              text={alert}
              visible={visibleAlerts.includes(index)}
            />
          ))}
        </View>

        <Text style={styles.instructionText}>Stay calm. Help is coming.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.safeButton, { backgroundColor: colors.green }]}
        >
          <Text style={styles.safeButtonText}>I AM SAFE</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function AlertItem({ text, visible }: { text: string; visible: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) })
      );
      opacity.value = withTiming(1, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) {
    return (
      <View style={styles.alertItem}>
        <View style={styles.checkPlaceholder} />
        <Text style={[styles.alertText, { opacity: 0.3 }]}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.alertItem}>
      <Animated.View style={[styles.checkContainer, animatedStyle]}>
        <Check size={18} color="#27AE60" strokeWidth={3} />
      </Animated.View>
      <Text style={styles.alertText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  threatTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 36,
    color: '#FFF8F8',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  reasonText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#FFE8EC',
    marginBottom: 32,
    textAlign: 'center',
  },
  evidenceContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  evidenceLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  evidenceId: {
    fontFamily: 'Sora-Bold',
    fontSize: 24,
    color: '#FFF8F8',
    letterSpacing: 3,
  },
  alertsList: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  alertText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 15,
    color: '#FFF8F8',
    flex: 1,
  },
  instructionText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: '#FFE8EC',
    textAlign: 'center',
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
