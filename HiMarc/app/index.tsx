import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
          trainName: `Train ${stop.trip_id}`,
          trainInfo: `Delay: ${stop.delay} seconds at stop ${stop.id}`
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
    <Card style={{ marginBottom: 10, width: '100%'}}>
      <Card.Content>
        <Title>{trainData.trainName}</Title>
        <Paragraph>{trainData.trainInfo}</Paragraph>
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

