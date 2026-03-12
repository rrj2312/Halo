import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Car, User, Bus, Briefcase, Coffee, Building, Moon, Sun } from 'lucide-react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useJourney } from '@/contexts/JourneyContext';
import { BASE_URL } from '@/config';

const modes = [
  { id: 'cab', label: 'Cab/Auto', icon: Car },
  { id: 'walking', label: 'Walking Alone', icon: User },
  { id: 'bus', label: 'Empty Bus', icon: Bus },
  { id: 'elevator', label: 'Elevator', icon: Building },
  { id: 'date', label: 'Date/Meetup', icon: Coffee },
  { id: 'workplace', label: 'Workplace', icon: Briefcase },
];

function HaloLogo({ color }: { color: string }) {
  return (
    <Svg width="60" height="40" viewBox="0 0 60 40">
      <Path
        d="M 5 35 Q 5 5 30 5 Q 55 5 55 35"
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { selectedMode, setSelectedMode, emergencyContact } = useJourney();

  const handleStart = async () => {
    if (!selectedMode) return;
    try {
      await fetch(`${BASE_URL}/journey/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode }),
      });
    } catch (e) {
      console.log('Backend offline, continuing anyway');
    }
    router.push('/(tabs)/active');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <HaloLogo color={colors.amber} />
            <Text style={[styles.logoText, { color: colors.text }]}>HALO</Text>
          </View>
          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: colors.cardBackground }]}
            onPress={toggleTheme}
          >
            {theme === 'light' ? <Moon size={20} color={colors.text} /> : <Sun size={20} color={colors.text} />}
          </TouchableOpacity>
        </View>

        <Text style={[styles.greeting, { color: colors.text }]}>You are protected.</Text>

        <View style={styles.modesGrid}>
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                onPress={() => setSelectedMode(mode.id)}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: isSelected ? '#1A0F00' : (theme === 'light' ? colors.cardTint : colors.cardBackground),
                    borderColor: isSelected ? colors.amber : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <Icon size={32} color={isSelected ? colors.amber : colors.text} />
                <Text style={[styles.modeLabel, { color: isSelected ? colors.amber : colors.text }]}>
                  {mode.label}
                </Text>
                <View style={[styles.statusDot, { backgroundColor: isSelected ? colors.amber : colors.grey }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={() => router.push('/settings')}>
          <View style={[styles.emergencyContact, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Protected by</Text>
            <Text style={[styles.contactName, { color: colors.text }]}>
              {emergencyContact.name || 'No contact set — tap to add'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: selectedMode ? colors.amber : colors.grey }]}
          onPress={handleStart}
          disabled={!selectedMode}
        >
          <Text style={styles.startButtonText}>
            {selectedMode ? `START HALO — ${selectedMode.toUpperCase()}` : 'SELECT A MODE FIRST'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  logoContainer: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  logoText: { fontFamily: 'Sora-Bold', fontSize: 24, letterSpacing: 2 },
  themeToggle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontFamily: 'Sora-Bold', fontSize: 32, marginBottom: 32, lineHeight: 42 },
  modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  modeCard: { width: '47%', aspectRatio: 1, borderRadius: 16, padding: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  modeLabel: { fontFamily: 'DMSans-Medium', fontSize: 14, marginTop: 12, textAlign: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 12, right: 12 },
  emergencyContact: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  contactLabel: { fontFamily: 'DMSans-Regular', fontSize: 13 },
  contactName: { fontFamily: 'Sora-SemiBold', fontSize: 18, marginTop: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40 },
  startButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  startButtonText: { fontFamily: 'Sora-Bold', fontSize: 16, color: '#0D0D0F', letterSpacing: 1 },
});