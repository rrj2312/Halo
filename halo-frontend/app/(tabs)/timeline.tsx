import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Share, Download } from 'lucide-react-native';

type EventType = 'safe' | 'warning' | 'danger';

interface TimelineEvent {
  time: string;
  type: EventType;
  title: string;
  detail?: string;
}

const events: TimelineEvent[] = [
  {
    time: '14:32',
    type: 'safe',
    title: 'Journey started',
    detail: 'From 5th Avenue, Manhattan',
  },
  {
    time: '14:35',
    type: 'safe',
    title: 'Driver verified',
    detail: 'License plate: ABC-1234',
  },
  {
    time: '14:38',
    type: 'warning',
    title: 'Route deviation detected',
    detail: 'Flagged phrase: "Taking a shortcut"',
  },
  {
    time: '14:42',
    type: 'warning',
    title: 'Unusual stop detected',
    detail: 'Location: Industrial area',
  },
  {
    time: '14:45',
    type: 'danger',
    title: 'Threat detected',
    detail: 'Audio analysis: Aggressive tone',
  },
  {
    time: '14:46',
    type: 'danger',
    title: 'Emergency alert sent',
    detail: 'Contact notified: Sarah Mitchell',
  },
];

export default function JourneyTimelineScreen() {
  const { colors } = useTheme();
  const [visibleEvents, setVisibleEvents] = useState<number[]>([]);

  useEffect(() => {
    events.forEach((_, index) => {
      setTimeout(() => {
        setVisibleEvents((prev) => [...prev, index]);
      }, index * 200);
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.scoreCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
            Safety Score
          </Text>
          <Text style={[styles.scoreValue, { color: colors.text }]}>82/100</Text>
          <Text style={[styles.scoreDescription, { color: colors.textSecondary }]}>
            Moderate risk detected and managed
          </Text>
        </View>

        <View style={styles.timelineContainer}>
          {events.map((event, index) => (
            <TimelineItem
              key={index}
              event={event}
              isLast={index === events.length - 1}
              visible={visibleEvents.includes(index)}
              colors={colors}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <Share size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Share Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <Download size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Save Evidence
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function TimelineItem({
  event,
  isLast,
  visible,
  colors,
}: {
  event: TimelineEvent;
  isLast: boolean;
  visible: boolean;
  colors: any;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(1.3, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) })
      );
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getColor = () => {
    switch (event.type) {
      case 'safe':
        return colors.green;
      case 'warning':
        return colors.amber;
      case 'danger':
        return colors.red;
    }
  };

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
          {event.time}
        </Text>
      </View>

      <View style={styles.timelineCenter}>
        <Animated.View
          style={[
            styles.timelineDot,
            { backgroundColor: getColor() },
            animatedDotStyle,
          ]}
        />
        {!isLast && (
          <View
            style={[styles.timelineLine, { backgroundColor: colors.border }]}
          />
        )}
      </View>

      <Animated.View
        style={[
          styles.timelineRight,
          {
            backgroundColor:
              event.type === 'safe'
                ? colors.cardBackground
                : event.type === 'warning'
                ? 'rgba(245, 166, 35, 0.1)'
                : 'rgba(192, 57, 43, 0.1)',
            borderColor: colors.border,
          },
          animatedCardStyle,
        ]}
      >
        <Text style={[styles.eventTitle, { color: colors.text }]}>
          {event.title}
        </Text>
        {event.detail && (
          <Text style={[styles.eventDetail, { color: colors.textSecondary }]}>
            {event.detail}
          </Text>
        )}
      </Animated.View>
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
    paddingBottom: 40,
  },
  scoreCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontFamily: 'Sora-Bold',
    fontSize: 48,
    marginVertical: 8,
  },
  scoreDescription: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  timelineContainer: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    width: 50,
    paddingTop: 4,
  },
  timeText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
  },
  timelineCenter: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineRight: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  eventTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    marginBottom: 4,
  },
  eventDetail: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  actionButtonText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
  },
});
