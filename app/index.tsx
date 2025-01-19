import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Image } from 'react-native';
import { Card, Title, Paragraph, Provider as PaperProvider, DarkTheme } from 'react-native-paper';
import livefetch from '../utils/merge';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function Index() {
  const [TrainData, setTrainData] = useState([]);

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

  // dynamic styling for each line
  const dynamicStyles = (routeLongName) => {
    let backgroundColor;
    switch (routeLongName) {
    case 'CAMDEN':
        backgroundColor = 'orange';
        break;
      case 'PENN':
        backgroundColor = '#004F98';
        break;
      case 'BRUNSWICK':
        backgroundColor = 'gray';
        break;
      default:
        backgroundColor = 'white'; // Fallback color
    }
  
    return {
      flexDirection: 'row',
      paddingRight: 4,
      paddingLeft: 4,
      backgroundColor: backgroundColor,
      alignItems: 'center',
      justifyContent: 'flex-start'
    };
  };


  useEffect(() => {
    async function fetchData() {
      try {
    const formattedTrainData = await livefetch();

        // Update the state with formatted train data
        //console.log(formattedTrainData);
    setTrainData(formattedTrainData);
    //console.log(decodedData);
      } catch (error) {
        console.error('Error fetching or processing data:', error);
      }
    }

    fetchData();  // Call the fetch function when the component mounts
  }, []);  // Empty dependency array ensures it runs only once when the component mounts

const TrainCard = ({ TrainData }) => {
    const [trainPosition, setTrainPosition] = useState(Math.random() * 100); // Combine function call with initial state
    const [modifiedTrainData, setModifiedTrainData] = useState(TrainData);

    const moveTrain = () => {
     setTrainPosition(Math.random() * 100); // Inline random position generation
  };

    useEffect(() => {
      // Example modification
      const updatedData = {
        ...TrainData,
        route_long_name: TrainData.route_long_name.split(' ')[0], // Retaining characters before the first blank space
        trip_id: TrainData.trip_id.replace(/[^0-9]/g, '') // Extracting only numeric characters
      };
      setModifiedTrainData(updatedData);
    }, [TrainData]);


  return (
        <Card style={styles.card}>
            <Card.Content>

                <View style={styles.cardContainer}>
                    <View style={styles.toprowcontainer}>
                      <View style={dynamicStyles(modifiedTrainData.route_long_name)}>
                        <Text style={styles.label}>{modifiedTrainData.route_long_name}</Text>
                        <Text style={styles.topLeftText}>{modifiedTrainData.trip_id}</Text>
                      </View>
                      <Text style={styles.DirectionText}> --->  {TrainData.trip_headsign}</Text>
                      <Text style={styles.topRightText}>{TrainData.delay}</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Title style={styles.title}></Title>
                        <View style={styles.lineContainer}>
                            <View style={styles.line}></View>
                            <Icon
                                name="train"
                                size={20}
                                style={[styles.trainIcon, { left: `${trainPosition}%` }]}
                            />
                            <View style={styles.dotLeft}></View>
                            <View style={styles.dotRight}></View>
                        </View>
                    </View>
		    <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '99%'}}>
		        <Text style={{fontWeight: 'bold'}}>{TrainData.start_time_short}</Text>
		        <Text style= {{fontWeight: 'bold'}}>{TrainData.end_time_short}</Text>
		    </View>
                </View>
            </Card.Content>
        </Card>
    );
};


  // TrainList Component
  const TrainList = ({ trains }) => (
    <ScrollView style={{ padding: 10 }}>
      {trains.map((train, index) => (
        <TrainCard key={index} TrainData={train} />
      ))}
    </ScrollView>
  );

  return (
    <PaperProvider>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 10,
        }}
      > 
        <TrainList trains={TrainData} />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create(
  { 
  card: { marginBottom: 10,
    width: '100%',
  },
  cardContainer: {
  },
  cardContent: {
    marginTop: 0, // +y buffer
    marginBottom: 0, // -y buffer
  },
  title: {
  },
  paragraph: {
  },
  topLeftText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    paddingLeft: 5,
  },
  topRightText: {
    right: 0,
    fontSize: 14,
    fontWeight: 'bold',
  },
  DirectionText: {
    flex: 1,
    flexDirection: 'row',
    left: 0,
    fontSize: 14,
    fontWeight: 'bold',
    paddingLeft: 30,
  },
  lineContainer: { 
    //flex: 1, 
    //flexDirection: 'row',
    justifyContent: 'center', // Center the line vertically 
    width: '92%',
    alignSelf: 'center',    
  },
  line: {
    flex: 1,
    justifyContent: 'center',
    height: 1, 
    backgroundColor: 'black',
    marginVertical: 4,
  },
  trainIcon: {
    position: 'absolute',
    top: -14,
    transform: [{ translateX: -10 }],
  }, 
  dotLeft: {
    position: 'absolute',      // Absolute positioning for the left dot
    left: 0,                   // Position at the left end
    top: 0,
    width: 8,                  // Dot width
    height: 8,                 // Dot height
    backgroundColor: 'black',  // Dot color
    borderRadius: 4,           // Make it a circle
  },
  dotRight: {
    position: 'absolute',      // Absolute positioning for the right dot
    right: 0,                  // Position at the right end
    top: 0,
    width: 8,                  // Dot width
    height: 8,                 // Dot height
    backgroundColor: 'black',  // Dot color
    borderRadius: 4,           // Make it a circle
  },
    spacer: {
    height: 105,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  toprowcontainer: {
    color: '#f5f5f5',
    flex: 1,
    flexDirection: 'row',
  },
});

