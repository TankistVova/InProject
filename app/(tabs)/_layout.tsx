import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index" // Указываем главный экран
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
      <Tabs.Screen name="DoctorsAppointment" options={{ href: null }} />
      <Tabs.Screen name="Profile" options={{ href: null }} />
      <Tabs.Screen name="AddAppointment" options={{ href: null }} />
      <Tabs.Screen name="Scanner" options={{ href: null }} />
      <Tabs.Screen name="CategoryScreen" options={{ href: null }} />
    </Tabs>
  );
}
