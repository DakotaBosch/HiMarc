import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { Card, Title, Paragraph, Provider as PaperProvider, DarkTheme } from 'react-native-paper';

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

  // Function to handle file input and process the data
  function handleFileInput(fileContent) {
    try {
      // Clean up the data by removing non-JSON text (if necessary)
      const jsonString = fileContent.replace(/^Decoded GTFS-RT Trip Updates:\s*/, '').trim();

      // Parse the JSON content
      const jsonData = JSON.parse(jsonString);

      // Create an array to store results for each entity
      const largestStops = jsonData.entity.map(entity => getLargestTimeStop(entity));

      return largestStops;
    } catch (parseError) {
      console.error('Error parsing the JSON data:', parseError);
      return [];
    }
  }

  useEffect(() => {
    // Simulate file content (in reality, you'd fetch this from a file)
    const fileContent = `Decoded GTFS-RT Trip Updates:
{
  "header": {
    "gtfs_realtime_version": "2.0",
    "incrementality": "FULL_DATASET",
    "timestamp": "1736100202"
  },
  "entity": [
    {
      "id": "191702",
      "trip_update": {
        "trip": {
          "trip_id": "Train485",
          "start_date": "20250105",
          "route_id": "11705"
        },
        "stop_time_update": [
          {
            "stop_sequence": 1,
            "departure": {
              "delay": 274,
              "time": "1736098474"
            },
            "stop_id": "11980"
          },
          {
            "stop_sequence": 2,
            "arrival": {
              "delay": 374,
              "time": "1736098954"
            },
            "departure": {
              "delay": 367,
              "time": "1736098987"
            },
            "stop_id": "11981"
          },
          {
            "stop_sequence": 3,
            "arrival": {
              "delay": 401,
              "time": "1736099341"
            },
            "departure": {
              "delay": 361,
              "time": "1736099341"
            },
            "stop_id": "11982"
          },
          {
            "stop_sequence": 4,
            "arrival": {
              "delay": 298,
              "time": "1736099548"
            },
            "departure": {
              "delay": 202,
              "time": "1736099602"
            },
            "stop_id": "11984"
          },
          {
            "stop_sequence": 5,
            "arrival": {
              "delay": 253,
              "time": "1736100043"
            },
            "departure": {
              "delay": 223,
              "time": "1736100043"
            },
            "stop_id": "11985"
          },
          {
            "stop_sequence": 6,
            "arrival": {
              "delay": 243,
              "time": "1736100403"
            },
            "departure": {
              "delay": 243,
              "time": "1736100423"
            },
            "stop_id": "11986"
          },
          {
            "stop_sequence": 7,
            "arrival": {
              "delay": 243,
              "time": "1736100873"
            },
            "departure": {
              "delay": 243,
              "time": "1736100903"
            },
            "stop_id": "11988"
          },
          {
            "stop_sequence": 8,
            "arrival": {
              "delay": 243,
              "time": "1736102043"
            },
            "stop_id": "11958"
          }
        ],
        "vehicle": {
          "id": "000084"
        },
        "timestamp": "1736100202"
      }
    },
    {
      "id": "191701",
      "trip_update": {
        "trip": {
          "trip_id": "Train482Sunday",
          "start_date": "20250105",
          "route_id": "11705"
        },
        "stop_time_update": [
          {
            "stop_sequence": 1,
            "departure": {
              "delay": 127,
              "time": "1736098927"
            },
            "stop_id": "11958"
          },
          {
            "stop_sequence": 2,
            "arrival": {
              "delay": 33,
              "time": "1736099493"
            },
            "departure": {
              "delay": 24,
              "time": "1736099544"
            },
            "stop_id": "11989"
          },
          {
            "stop_sequence": 3,
            "arrival": {
              "delay": 27,
              "time": "1736099997"
            },
            "departure": {
              "time": "1736100000"
            },
            "stop_id": "11991"
          },
          {
            "stop_sequence": 4,
            "arrival": {
              "delay": 55,
              "time": "1736100375"
            },
            "departure": {
              "delay": 55,
              "time": "1736100415"
            },
            "stop_id": "11992"
          },
          {
            "stop_sequence": 5,
            "arrival": {
              "delay": 55,
              "time": "1736100835"
            },
            "departure": {
              "delay": 55,
              "time": "1736100895"
            },
            "stop_id": "11993"
          },
          {
            "stop_sequence": 6,
            "arrival": {
              "delay": 55,
              "time": "1736101210"
            },
            "departure": {
              "delay": 55,
              "time": "1736101255"
            },
            "stop_id": "11994"
          },
          {
            "stop_sequence": 7,
            "arrival": {
              "delay": 55,
              "time": "1736101635"
            },
            "departure": {
              "delay": 55,
              "time": "1736101675"
            },
            "stop_id": "11995"
          },
          {
            "stop_sequence": 8,
            "arrival": {
              "delay": 55,
              "time": "1736102395"
            },
            "stop_id": "12002"
          }
        ],
        "vehicle": {
          "id": "000087"
        },
        "timestamp": "1736100202"
      }
    }
  ]
}`;   
    // Handle the file content and fetch the largestStops data
    const largestStops = handleFileInput(fileContent);

    // Format the data for the TrainCard component
    if (largestStops) {
      const formattedTrainData = largestStops.map(stop => ({
        trainName: `${stop.trip_id}`,
        trainInfo: `Delay: ${stop.delay} seconds at stop ${stop.id}`,
      }));

      setTrainData(formattedTrainData); // Update state with the formatted data
    }
  }, []); // Empty dependency array to run this effect only once when the component mounts

  // TrainCard Component
  const TrainCard = ({ trainData }) => (
    <Card style={{ marginBottom: 10, width: '100%'}}>
      <Card.Content>
        <Title style={{flex: 1, fontSize:12}}>{trainData.trainName}</Title>
        <Paragraph>{trainData.trainInfo}</Paragraph>
	<View style={styles.textBackground}>
    	  <Text style={styles.text}>CAMDEN</Text>
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
          padding: 10, // Add some padding to the container
        }}
      >
        <Text style={{ color: 'white' }}>Train Timetable</Text>
        <TrainList trains={trainData} />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  textBackground: {
    position: 'absolute',
    top: 4,
    left: 16,
    backgroundColor: '#ffffff',  // Background color for the text
    padding: 0,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 4,  // Optional: adds rounded corners
  },
  text: {
    fontSize: 12,
    color: '#0c0936',  // Text color
    fontWeight: 'bold',
  },
});


