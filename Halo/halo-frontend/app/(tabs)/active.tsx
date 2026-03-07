import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useState } from 'react';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ThreatLevel = 'safe' | 'warning' | 'danger';

const transcriptMessages = [
  { time: '14:32', text: 'Started journey from 5th Avenue' },
  { time: '14:35', text: 'Driver verified: License plate ABC-1234' },
  { time: '14:38', text: 'Route deviation detected' },
  { time: '14:39', text: 'Audio analysis: Normal conversation' },
  { time: '14:42', text: 'Current location: Downtown area' },
];

export default function ActiveMonitoringScreen() {
  const { colors } = useTheme();
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('safe');
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const duration = threatLevel === 'safe' ? 2000 : threatLevel === 'warning' ? 1000 : 500;

    scale.value = withRepeat(
      withTiming(1.1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    opacity.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [threatLevel]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'safe':
        return colors.grey;
      case 'warning':
        return colors.amber;
      case 'danger':
        return colors.red;
    }
  };

  const getThreatText = () => {
    switch (threatLevel) {
      case 'safe':
        return 'SAFE';
      case 'warning':
        return 'WARNING';
      case 'danger':
        return 'DANGER';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.modeTitle, { color: colors.text }]}>
          CAB MODE — ACTIVE
        </Text>

        <View style={styles.meterContainer}>
          <Animated.View style={[styles.meterOuter, animatedStyle]}>
            <Svg width="240" height="240" style={styles.meterSvg}>
              <Circle
                cx="120"
                cy="120"
                r="100"
                stroke={getThreatColor()}
                strokeWidth="12"
                fill="none"
              />
            </Svg>
          </Animated.View>

          <View style={styles.meterCenter}>
            <Text style={[styles.threatText, { color: getThreatColor() }]}>
              {getThreatText()}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.pulseDot, { backgroundColor: colors.amber }]} />
          <Text style={[styles.statusText, { color: colors.amber }]}>
            HALO Active
          </Text>
        </View>

        <View
          style={[
            styles.escalationBar,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.escalationLabel, { color: colors.textSecondary }]}>
            Auto-escalation
          </Text>
          <View style={styles.escalationSteps}>
            <View style={styles.escalationDot} />
            <View style={[styles.escalationLine, { backgroundColor: colors.border }]} />
            <View style={styles.escalationDot} />
            <View style={[styles.escalationLine, { backgroundColor: colors.border }]} />
            <View style={styles.escalationDot} />
            <View style={[styles.escalationLine, { backgroundColor: colors.border }]} />
            <View style={styles.escalationDot} />
          </View>
          <View style={styles.escalationLabels}>
            <Text style={[styles.escalationStep, { color: colors.textSecondary }]}>
              Warning
            </Text>
            <Text style={[styles.escalationStep, { color: colors.textSecondary }]}>
              Danger
            </Text>
            <Text style={[styles.escalationStep, { color: colors.textSecondary }]}>
              Witness
            </Text>
            <Text style={[styles.escalationStep, { color: colors.textSecondary }]}>
              Alert
            </Text>
          </View>
        </View>

        <View style={styles.transcriptContainer}>
          <Text style={[styles.transcriptTitle, { color: colors.text }]}>
            Live Feed
          </Text>
          {transcriptMessages.map((msg, index) => (
            <View key={index} style={styles.transcriptItem}>
              <Text style={[styles.transcriptTime, { color: colors.textSecondary }]}>
                {msg.time}
              </Text>
              <Text style={[styles.transcriptText, { color: colors.text }]}>
                {msg.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.endButton, { borderColor: colors.amber }]}
        >
          <Text style={[styles.endButtonText, { color: colors.amber }]}>
            END JOURNEY
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  modeTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 40,
  },
  meterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    height: 280,
  },
  meterOuter: {
    position: 'absolute',
  },
  meterSvg: {
    transform: [{ rotate: '-90deg' }],
  },
  meterCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  threatText: {
    fontFamily: 'Sora-Bold',
    fontSize: 32,
    letterSpacing: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
  },
  escalationBar: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  escalationLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    marginBottom: 12,
  },
  escalationSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  escalationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C4C4C4',
  },
  escalationLine: {
    flex: 1,
    height: 2,
  },
  escalationLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  escalationStep: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
  },
  transcriptContainer: {
    gap: 12,
  },
  transcriptTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  transcriptItem: {
    flexDirection: 'row',
    gap: 12,
  },
  transcriptTime: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    width: 40,
  },
  transcriptText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    flex: 1,
  },
  buttonSpacer: {
    height: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
  },
  endButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonText: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});
