import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Location from 'expo-location';

// Function to format time from HH:MM:SS to H:MM
function formatTime(timeString) {
  if (typeof timeString !== 'string' || timeString.split(':').length !== 3) {
    console.error("Invalid time format:", timeString);
    return null;
  }
  const [hours, minutes] = timeString.split(':');
  let hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${period}`;
}

function cleanStopName(name) {
  const substringsToRemove = ['MARC', ' nb', ' sb', ' wb', ' eb'];
  let cleanedName = name;
  substringsToRemove.forEach(substring => {
    cleanedName = cleanedName.replace(new RegExp(substring, 'gi'), '').trim();
  });
  return cleanedName;
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert('Push notifications only work on a real device.');
    return null;
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Push notifications permission is required.');
    return null;
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

const TrainDetails = () => {
  const navigation = useNavigation();
  const { trainData } = useLocalSearchParams();
  const [parsedTrainData, setParsedTrainData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (trainData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(trainData));
        setParsedTrainData(parsedData);
      } catch (error) {
        console.error("Error parsing trainData:", error);
        setParsedTrainData(null);
      }
    }
  }, [trainData]);

  const handleSubscribe = async () => {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) return;

    try {
      const response = await fetch('http://173.66.239.26:3000/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ train_id: parsedTrainData.trip_id, push_token: pushToken }),
      });

      if (response.ok) {
        setSubscriptionStatus((prev) => new Map(prev).set(parsedTrainData.trip_id, true));
        Alert.alert('Subscribed to notifications for this train!');
      } else {
        Alert.alert('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      Alert.alert('Failed to subscribe. Please try again.');
    }
  };

  const handleUnsubscribe = async () => {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) return;

    try {
      const response = await fetch('http://173.66.239.26:3000/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ train_id: parsedTrainData.trip_id, push_token: pushToken }),
      });

      if (response.ok) {
        setSubscriptionStatus((prev) => new Map(prev).set(parsedTrainData.trip_id, false));
        Alert.alert('Unsubscribed from notifications for this train.');
      } else {
        Alert.alert('Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      Alert.alert('Failed to unsubscribe. Please try again.');
    }
  };

  if (!parsedTrainData) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isSubscribed = subscriptionStatus.get(parsedTrainData.trip_id) || false;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Time Table</Text>
      <View style={styles.timeline}>
        {parsedTrainData.stops.map((stop, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.dot} />
            <View style={styles.stopDetails}>
              <Text style={styles.stopId}>{cleanStopName(stop.stop_name)}</Text>
              <Text style={styles.arrivalTime}>{formatTime(stop.arrival_time)}</Text>
            </View>
          </View>
        ))}
      </View>

      <Button
        title={isSubscribed ? 'Unsubscribe' : 'Subscribe to Notifications'}
        onPress={isSubscribed ? handleUnsubscribe : handleSubscribe}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TrainDetails;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    marginBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 26,
    textAlign: 'center',
  },
  timeline: {
    borderLeftWidth: 2,
    borderLeftColor: '#888',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8000',
    position: 'absolute',
    left: -7,
    top: 5,
  },
  stopDetails: {
    flexDirection: 'column',
    marginLeft: 24,
  },
  stopId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  arrivalTime: {
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    width: width * 0.25,
    paddingVertical: 10,
    backgroundColor: '#FF8000',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 30,
    marginTop: 30,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

