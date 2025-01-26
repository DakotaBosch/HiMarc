import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter

export default function TrainDetails() {
  const router = useRouter(); // Initialize the router to access the back functionality

  const handleGoBack = () => {
    router.back(); // Navigate back to the previous page
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Train Details Page (No Data)</Text>
      
      {/* Back button */}
      <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#004F98',
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

