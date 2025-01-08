import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useColorScheme } from 'react-native'; // Correct hook import
import Icon from 'react-native-vector-icons/Ionicons'; // For train icons

export default function TabLayout() {
  const colorScheme = useColorScheme(); // Get the system's color scheme (light or dark)

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000', // Set active tab color
        tabBarStyle: {
          backgroundColor: '#212121', // Dark gray background color for the tab bar
        },
        headerShown: false, // Optional: Hide header if you don’t need it
      }}
    >
      <Tabs.Screen
        name="index" // This points to the "index.js" screen
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <Icon name="train-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule" // Adding new train tab
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <Icon name="calendar-clear-outline" size={24} color={color} />, // Replace icon with train icon
        }}
      />
    </Tabs>
  );
}

