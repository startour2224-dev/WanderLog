import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import MemoryScreen from './src/screens/MemoryScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import { t } from './src/i18n/translations'; // 辞書を読み込み

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: any;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Map') iconName = 'map';
            else if (route.name === 'Memories') iconName = 'images';
            else if (route.name === 'Analytics') iconName = 'stats-chart';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0.5,
            borderTopColor: '#e0e0e0',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: t.nav.home }} />
        <Tab.Screen name="Map" component={MapScreen} options={{ title: t.nav.map }} />
        <Tab.Screen name="Memories" component={MemoryScreen} options={{ title: t.nav.memories }} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: t.nav.analytics }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}