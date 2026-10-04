import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TabBar } from '@/components/TabBar';
import { dark, fonts, spacing } from '@/theme';

export default function Alerts() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={40} color={dark.muted} />
          <Text style={styles.emptyText}>No new notifications</Text>
          <Text style={styles.emptySub}>When Gather matches you into an event, your invite shows up here.</Text>
        </View>
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },
  content: { padding: spacing(2.5), flexGrow: 1 },
  title: { fontFamily: fonts.heading, fontSize: 32, color: dark.text, marginTop: spacing(1) },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(1), paddingTop: spacing(10) },
  emptyText: { fontFamily: fonts.heading, fontSize: 20, color: dark.text, marginTop: spacing(1) },
  emptySub: { fontFamily: fonts.body, fontSize: 14, color: dark.muted, textAlign: 'center', paddingHorizontal: spacing(4) },
});
