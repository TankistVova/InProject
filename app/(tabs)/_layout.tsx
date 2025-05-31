import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2AB0C3',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Инвентарь',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Calendar"
          options={{
            title: 'Календарь',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="AddMedicine"
          options={{
            title: 'Добавить вручную',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Menu"
          options={{
            title: 'Меню',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'menu' : 'menu-outline'} size={size} color={color} />
            ),
          }}
        />
        {/* Скрытые экраны */}
        <Tabs.Screen name="DoctorsAppointment" options={{ href: null }} />
        <Tabs.Screen name="Profile" options={{ href: null }} />
        <Tabs.Screen name="AddAppointment" options={{ href: null }} />
        <Tabs.Screen name="Scanner" options={{ href: null }} />
        <Tabs.Screen name="CategoryScreen" options={{ href: null }} />
        <Tabs.Screen name="AddReminder" options={{ href: null }} />
        <Tabs.Screen name="Notifications" options={{ href: null }} />
         <Tabs.Screen name="Authors" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight || 0
  }
});
