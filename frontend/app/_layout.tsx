import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, Text, Image, useColorScheme, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons'; // For train icons
import * as Notifications from 'expo-notifications';

export default function TabLayout() {
  const colorScheme = useColorScheme(); // Get the system's color scheme (light or dark)

  // Step 1: Request permissions and get push token
  useEffect(() => {
    const registerPushNotifications = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push Token:', token);

      // Optionally, send the token to your server here
      // await fetch('http://your-server-url/save-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ push_token: token }),
      // });
    };

    registerPushNotifications();
  }, []);

  // Step 4: Handle incoming notifications
  useEffect(() => {
    // Set up the notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Listen for incoming notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can show an alert or navigate to a specific screen here
    });

    // Clean up the listener
    return () => subscription.remove();
  }, []);

  const BasicHeader = () => {
    return (
      <View
        style={{
          backgroundColor: '#004F98',
          height: '14%',
          alignItems: 'center',
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Image
            source={require('@/assets/images/marc_white.png')}
            style={{ width: 200 }}
            resizeMode="contain"
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
