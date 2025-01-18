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
	tabBarInactiveTintColor: colorScheme === 'dark' ? '#d3d3d3' : '#d3d3d3', // Set inactive tab color
        tabBarStyle: {
          backgroundColor: '#000000', // Dark gray background color for the tab bar
        },
        headerShown: true, // Optional: Hide header if you don’t need it
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <Icon name="train-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <Icon name="calendar-clear-outline" size={24} color={color} />, // Replace icon with train icon
        }}
      />
    </Tabs>
  );
}

