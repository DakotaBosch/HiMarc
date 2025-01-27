import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Dimensions } from 'react-native';

// Function to format time from HH:MM:SS to H:MM
function formatTime(timeString) {
  // Ensure the timeString is in HH:MM:SS format
  if (typeof timeString !== 'string' || timeString.split(':').length !== 3) {
    console.error("Invalid time format:", timeString); // Log invalid format for debugging
    return null; // Return null for invalid time format
  }
  const [hours, minutes] = timeString.split(':'); // Split time string into hours and minutes
  let hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${period}`; // Remove leading zeros from hours and keep minutes
}

function cleanStopName(name) {
  // Define substrings to remove
  const substringsToRemove = ['MARC', 'nb'];

  // Remove each substring from the name
  let cleanedName = name;
  substringsToRemove.forEach(substring => {
    cleanedName = cleanedName.replace(new RegExp(substring, 'gi'), '').trim(); // 'gi' for case-insensitive global match
  });

  return cleanedName;
}

const TrainDetails = () => {
  const navigation = useNavigation();
  const { trainData } = useLocalSearchParams();
  const [parsedTrainData, setParsedTrainData] = useState(null);

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

  if (!parsedTrainData) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Train Stops</Text>
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

      {/* Back Button at the Bottom */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 26,
    textAlign: 'center',
  },
  timeline: {
    borderLeftWidth: 2,
    borderLeftColor: '#888',
    position: 'relative',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  arrivalTime: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    width: width * 0.25,
    marginLeft: -60,
    paddingVertical: 10,
    paddingHorizontal: 20,
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

