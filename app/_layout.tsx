import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text, Image, useColorScheme, StatusBar} from 'react-native';
import {SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons'; // For train icons

export default function TabLayout() {
  const colorScheme = useColorScheme(); // Get the system's color scheme (light or dark)

  const BasicHeader = () => {
    return (
      <View 
	style = {{
		backgroundColor: '#004F98', 
		height: '16%', 
		alignItems: 'center', 
	}} 
      >
	<SafeAreaView style={{ flex:1 }}>
 	  <Image 
	    source={require('@/assets/images/Marc_w.png')} 
	    style={{ width: 200}} resizeMode='contain' 
	  />
	</SafeAreaView>	
      </View>
    );
  };


  return (
  <>
    <StatusBar translucent backgroundColor="transparent" />
    <BasicHeader />
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000', // Set active tab color
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#d3d3d3' : '#d3d3d3', // Set inactive tab color
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000', // Dark gray background color for the tab bar
	  height: 0, //temp hide tabbar
        },
      })}
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
  </>
  );
}

