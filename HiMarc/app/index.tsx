import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Provider as PaperProvider, DarkTheme } from 'react-native-paper';
import fetchAndDecodeGTFSRT from '../utils/status';  // Import the function from 'status.js'

export default function Index() {
  const [trainData, setTrainData] = useState([]);

  // Function to get the entity with the largest time in stop_time_update for each entity
  function getLargestTimeStop(entity) {
    let largestTimeStop = null;
    let largestTime = -Infinity; // Initialize with the smallest value

    // Loop through each stop_time_update
    entity.trip_update.stop_time_update.forEach(stop => {
      // Handle both arrival and departure times
      const stopTime = stop.departure ? stop.departure.time : stop.arrival.time;

      if (parseInt(stopTime) > largestTime) {
        largestTime = parseInt(stopTime);
        largestTimeStop = {
          id: entity.id,
          trip_id: entity.trip_update.trip.trip_id,
          delay: stop.departure ? stop.departure.delay : stop.arrival.delay,
        };
      }
    });

    return largestTimeStop;
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const decodedData = await fetchAndDecodeGTFSRT();  // Fetch and decode data from the API
        console.log(decodedData);  // Log the data for debugging

        // Handle the decoded data and get the largest stops
        const largestStops = decodedData.entity.map(entity => getLargestTimeStop(entity));

        // Format the data for the TrainCard component
        const formattedTrainData = largestStops.map(stop => ({
          trainName: `${stop.trip_id}`,
          trainInfo: `${Math.round(stop.delay/60)} min delay`
        }));

        // Update the state with formatted train data
        console.log(formattedTrainData);
    setTrainData(formattedTrainData);
    console.log(decodedData);
      } catch (error) {
        console.error('Error fetching or processing data:', error);
      }
    }

    fetchData();  // Call the fetch function when the component mounts
  }, []);  // Empty dependency array ensures it runs only once when the component mounts

// TrainCard Component
const TrainCard = ({ trainData }) => (
    <Card style={styles.card}>
        <Card.Content>
            <View style={styles.cardContainer}>
                <Text style={styles.topLeftText}>{trainData.trainName}</Text>
                <Text style={styles.topRightText}>{trainData.trainInfo}</Text>
                <View style={styles.cardContent}>
                    <Title style={styles.title}></Title>
                    <View style={styles.lineContainer}>
                        <View style={styles.line}></View>
                        <View style={styles.dotLeft}></View>
                        <View style={styles.dotRight}></View>
                    </View>
                </View>
            </View>
        </Card.Content>
    </Card>
);



  // TrainList Component
  const TrainList = ({ trains }) => (
    <ScrollView style={{ padding: 10 }}>
      {trains.map((train, index) => (
        <TrainCard key={index} trainData={train} />
      ))}
    </ScrollView>
  );

  return (
    <PaperProvider theme={DarkTheme}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 10,
          backgroundColor: 'black',
        }}
      >
        <Text style={{ color: 'white' }}>Train Timetable</Text>
        <TrainList trains={trainData} />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({ card: { marginBottom: 10,
    width: '100%',
    backgroundColor: '#1C1C1C',
  },
  cardContainer: {
    position: 'relative',
    padding: 16,
  },
  cardContent: {
    marginTop: 28, // +y buffer
    marginBottom: 28, // -y buffer
  },
  title: {
    color: 'white',
  },
  paragraph: {
    color: 'white',
  },
  topLeftText: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  topRightText: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  bottomRightText: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  lineContainer: { 
    flex: 1, 
    justifyContent: 'center', // Center the line vertically 
  },
  line: {
    height: 1, 
    backgroundColor: 'white',
    marginVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  dotLeft: {
  position: 'absolute',      // Absolute positioning for the left dot
    left: 0,                   // Position at the left end
    width: 8,                  // Dot width
    height: 8,                 // Dot height
    backgroundColor: 'white',  // Dot color
    borderRadius: 4,           // Make it a circle
  },
  dotRight: {
    position: 'absolute',      // Absolute positioning for the right dot
    right: 0,                  // Position at the right end
    width: 8,                  // Dot width
    height: 8,                 // Dot height
    backgroundColor: 'white',  // Dot color
    borderRadius: 4,           // Make it a circle
  },
});

