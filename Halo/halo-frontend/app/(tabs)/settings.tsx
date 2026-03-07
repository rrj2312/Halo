import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { Moon, Sun } from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const [contactName, setContactName] = useState('Sarah Mitchell');
  const [contactNumber, setContactNumber] = useState('+1 (555) 123-4567');
  const [autoDetection, setAutoDetection] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Emergency Contact
          </Text>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Name
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={contactName}
              onChangeText={setContactName}
              placeholder="Enter contact name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Phone Number
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Detection
          </Text>

          <View
            style={[
              styles.toggleRow,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                Auto-detection
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                Automatically detect threat situations
              </Text>
            </View>
            <Switch
              value={autoDetection}
              onValueChange={setAutoDetection}
              trackColor={{ false: colors.border, true: colors.amber }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View
            style={[
              styles.toggleRow,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                Offline mode
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                Save audio locally. Uploads when connection returns.
              </Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: colors.border, true: colors.amber }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Alerts</Text>

          <View
            style={[
              styles.toggleRow,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                SMS Alerts
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                Send SMS to emergency contact
              </Text>
            </View>
            <Switch
              value={smsAlerts}
              onValueChange={setSmsAlerts}
              trackColor={{ false: colors.border, true: colors.amber }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appearance
          </Text>

          <TouchableOpacity
            style={[
              styles.toggleRow,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
            onPress={toggleTheme}
          >
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                Toggle between light and dark theme
              </Text>
            </View>
            <View
              style={[
                styles.themeIconContainer,
                { backgroundColor: colors.amber },
              ]}
            >
              {theme === 'light' ? (
                <Sun size={20} color="#0D0D0F" />
              ) : (
                <Moon size={20} color="#0D0D0F" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            HALO v1.0.0
          </Text>
          <Text style={[styles.versionSubtext, { color: colors.textSecondary }]}>
            Built for your safety
          </Text>
        </View>
      </ScrollView>
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
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 32,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
    marginBottom: 16,
  },
  inputContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'DMSans-Medium',
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    marginBottom: 4,
  },
  toggleDescription: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
  },
  versionSubtext: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    marginTop: 4,
  },
});
