import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dark, spacing } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { route: string; icon: IoniconName; active: IoniconName }[] = [
  { route: '/home', icon: 'home-outline', active: 'home' },
  { route: '/explore', icon: 'compass-outline', active: 'compass' },
  { route: '/events', icon: 'calendar-outline', active: 'calendar' },
  { route: '/alerts', icon: 'notifications-outline', active: 'notifications' },
  { route: '/profile', icon: 'person-outline', active: 'person' },
];

export function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing(1.5)) }]}>
      {TABS.map((t) => {
        const active = path === t.route;
        return (
          <Pressable
            key={t.route}
            style={styles.item}
            onPress={() => {
              if (!active) router.replace(t.route as never);
            }}
            hitSlop={8}
          >
            <Ionicons name={active ? t.active : t.icon} size={25} color={active ? dark.text : dark.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: dark.card,
    backgroundColor: dark.bg,
  },
  item: { padding: spacing(1) },
});
