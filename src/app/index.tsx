import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gather</Text>
      <Text style={styles.subtitle}>
        AI-powered events that bring strangers together in Vancouver.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
});
