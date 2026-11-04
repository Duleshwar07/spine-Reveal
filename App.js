import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SetupScreen from './src/screens/SetupScreen';
import GameScreen from './src/screens/GameScreen';
import { MonetizationProvider } from './src/monetization/MonetizationContext';
import { colors } from './src/theme';

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [settings, setSettings] = useState({ players: [], mode: 'tod', category: 'family' });

  const handleStart = useCallback((s) => {
    setSettings(s);
    setScreen('game');
  }, []);

  const handlePlayersChange = useCallback((players) => {
    setSettings((s) => ({ ...s, players }));
  }, []);

  const handleExit = useCallback((players) => {
    setSettings((s) => ({ ...s, players }));
    setScreen('setup');
  }, []);

  return (
    <SafeAreaProvider>
      <MonetizationProvider>
        <SafeAreaView style={styles.root}>
          <StatusBar style="light" />
          {screen === 'setup' ? (
            <SetupScreen initial={settings} onStart={handleStart} />
          ) : (
            <GameScreen settings={settings} onPlayersChange={handlePlayersChange} onExit={handleExit} />
          )}
        </SafeAreaView>
      </MonetizationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
