import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Provider as PaperProvider, DarkTheme } from 'react-native-paper';
import livefetch from '../utils/merge';
import Icon from 'react-native-ico-mingcute-tiny-bold-filled';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';

export default function Index() {
  const [TrainData, setTrainData] = useState([]);
  const router = useRouter();

  // Function to get the entity with the largest time in stop_time_update for each entity
  function getLargestTimeStop(entity) {
    let largestTimeStop = null;
    let largestTime = -Infinity;

    entity.trip_update.stop_time_update.forEach(stop => {
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
        backgroundColor = 'white';
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
        setTrainData(formattedTrainData);
      } catch (error) {
        console.error('Error fetching or processing data:', error);
      }
    }

    fetchData();
  }, []);

  const TrainCard = ({ TrainData }) => {
    const [trainPosition, setTrainPosition] = useState(TrainData.completionPercentage);
    const [modifiedTrainData, setModifiedTrainData] = useState(TrainData);

    const moveTrain = () => {
      if (TrainData.completionPercentage < 2) {
        setTrainPosition(2);
      } else if (TrainData.completionPercentage > 96) {
        setTrainPosition(96);
      } else {
        setTrainPosition(TrainData.completionPercentage || 0);
      }
    };

    useEffect(() => {
      moveTrain();
    }, [TrainData.completionPercentage]);

    useEffect(() => {
      const updatedData = {
        ...TrainData,
        route_long_name: TrainData.route_long_name.split(' ')[0],
        trip_id: TrainData.trip_id.replace(/[^0-9]/g, '')
      };
      setModifiedTrainData(updatedData);
    }, [TrainData]);

    const handleCardPress = () => {
      const serializedData = JSON.stringify(TrainData);
      // Navigate to the new screen with `trip_id` in the URL
      router.push(`/trainDetails?trainData=${encodeURIComponent(serializedData)}`);
    };
    

    return (
      <TouchableOpacity onPress={handleCardPress} activeOpacity ={1}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardContainer}>
              <View style={styles.toprowcontainer}>
                <View style={dynamicStyles(modifiedTrainData.route_long_name)}>
                  <Text style={styles.label}>{modifiedTrainData.route_long_name}</Text>
                  <Text style={styles.topLeftText}>{modifiedTrainData.trip_id}</Text>
                </View>
                <Text style={styles.DirectionText}> ---> {TrainData.trip_headsign}</Text>
                <Text style={styles.topRightText}>{TrainData.delay}</Text>
              </View>
              <View style={styles.cardContent}>
                <Title style={styles.title}></Title>
                <View style={styles.lineContainer}>
                  <View style={styles.line}></View>
                  <Icon
                    name="train"
                    size={100}
                    style={[styles.trainIcon, { left: `${trainPosition}%` }]}
                  />
                  <View style={styles.dotLeft}></View>
                  <View style={styles.dotRight}></View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '99%' }}>
                <Text style={{ fontWeight: 'bold' }}>{TrainData.start_time_short}</Text>
                <Text style={{ fontWeight: 'bold' }}>{TrainData.end_time_short}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

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

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    width: '100%',
  },
  cardContainer: {},
  cardContent: {
    marginTop: 0,
    marginBottom: 0,
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
    justifyContent: 'center',
    width: '92%',
    alignSelf: 'center',
  },
  line: {
    flex: 1,
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
    position: 'absolute',
    left: 0,
    top: 0,
    width: 8,
    height: 8,
    backgroundColor: 'black',
    borderRadius: 4,
  },
  dotRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: 8,
    backgroundColor: 'black',
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  toprowcontainer: {
    flex: 1,
    flexDirection: 'row',
  },
});

