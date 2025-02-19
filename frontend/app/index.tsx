import { ScrollView, Text, View, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Title, Provider as PaperProvider, Button } from 'react-native-paper';
import Icon from 'react-native-ico-mingcute-tiny-bold-filled';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Index() {
  const [TrainData, setTrainData] = useState([]);
  const router = useRouter();
  const [selectedLine, setSelectedLine] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchData() {
    try {
      setIsRefreshing(true); // Start refresh
      const serverResponse = await axios.get('https://www.himarc.us/trains');
      const serverTrainData = serverResponse.data;
      setTrainData(serverTrainData);
      console.log(JSON.stringify(serverTrainData, null, 2));
    } catch (error) {
      console.error('Error fetching or processing data:', error);
    } finally {
      setIsRefreshing(false); // End refresh
    }
  }


  // Dynamic styling for each line
  const dynamicStyles = (routeLongName) => {
    let backgroundColor;
    switch (routeLongName) {
      case 'CAMDEN':
        backgroundColor = '#F26F21';
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
      alignItems: 'top',
      paddingRight: 4,
      paddingLeft: 4,
      backgroundColor: backgroundColor,
      justifyContent: 'flex-start'
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered train data based on selected line
  const filteredTrains = selectedLine
    ? TrainData.filter(train => train.route_long_name.split(' ')[0] === selectedLine)
    : TrainData;

  const FilterCard = () => (
    <Card style={styles.filterCard}>
      <Card.Content style={{ paddingVertical: 4 }}>
        <Text style={styles.filterTitle}>Line</Text>
        <View style={styles.filterButtons}>
          {['CAMDEN', 'PENN', 'BRUNSWICK'].map(line => (
            <Button
              key={line}
              mode={selectedLine === line ? 'contained' : 'outlined'}
              onPress={() => setSelectedLine(line === selectedLine ? null : line)}
              style={styles.filterButton}
              labelStyle={{ color: 'black' }}
              theme={{ colors: { primary: '#D3D3D3' } }}
            >
              {line}
            </Button>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const TrainCard = ({ TrainData }) => {
    const [trainPosition, setTrainPosition] = useState(TrainData.completionPercentage);
    const [modifiedTrainData, setModifiedTrainData] = useState(TrainData);

    useEffect(() => {
      if (TrainData.completionPercentage < 2) {
        setTrainPosition(2);
      } else if (TrainData.completionPercentage > 92) {
        setTrainPosition(92);
      } else {
        setTrainPosition(TrainData.completionPercentage || 0);
      }
    }, [TrainData.completionPercentage]);

    useEffect(() => {
      const capitalizeFirstLetter = (str) =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

      const updatedData = {
        ...TrainData,
        route_long_name: TrainData.route_long_name.split(' ')[0],
        trip_id: TrainData.trip_id.replace(/[^0-9]/g, ''),
        trip_headsign: capitalizeFirstLetter(TrainData.trip_headsign) // Apply capitalization
      };
      setModifiedTrainData(updatedData);
    }, [TrainData]);

    const handleCardPress = () => {
      const serializedData = JSON.stringify(TrainData);
      // Navigate to the new screen with `trip_id` in the URL
      router.push(`/trainDetails?trainData=${encodeURIComponent(serializedData)}`);
    };

    return (
      <TouchableOpacity onPress={handleCardPress} activeOpacity={1}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardContainer}>
              <View style={styles.toprowcontainer}>
                <View style={dynamicStyles(modifiedTrainData.route_long_name)}>
                  <Text style={styles.label}>{modifiedTrainData.route_long_name}</Text>
                </View>
                <Text style={styles.topLeftText}>{modifiedTrainData.trip_id}</Text>
                <Text style={styles.DirectionText}>Direction: {modifiedTrainData.trip_headsign}</Text>
                <Text style={styles.topRightText}>{TrainData.delay_formatted}</Text>
              </View>
              <View style={styles.cardContent}>
                <Title style={styles.ddtitle}></Title>
                <View style={styles.lineContainer}>
                  <View style={styles.line}></View>
                  <Icon
                    name="train"
                    height="26"
                    width="26"
                    style={[styles.trainIcon, { left: `${trainPosition}%`, top: -22 }]}
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
        }}>
        {/* Background at the top */}
        <View style={styles.backgroundTop}></View>
        <FilterCard />
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />}
        >
          {filteredTrains.map((train, index) => (
            <TrainCard key={index} TrainData={train} />
          ))}
        </ScrollView>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    width: '100%',
    backgroundColor: 'white',
  },
  cardContainer: {
  },
  cardContent: {
    marginTop: 0,
    marginBottom: -20,
  },
  topLeftText: {
    alignItems: 'center',
    marginLeft: 4,
    flexDirection: 'row',
    left: 0,
    fontSize: 16,
    fontWeight: 'bold',
  },
  topRightText: {
    position: 'absolute',
    right: 0,
    fontSize: 14,
    fontWeight: 'bold',
  },
  DirectionText: {
    flexDirection: 'row',
    fontSize: 14,
    paddingLeft: 30,
  },
  lineContainer: {
    justifyContent: 'center',
    width: '92%',
    alignSelf: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: 'black',
    marginTop: 3,
  },
  trainIcon: {
  },
  dotLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 9,
    height: 9,
    backgroundColor: 'black',
    borderRadius: 4,
  },
  dotRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 9,
    height: 9,
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
  filterCard: {
    marginBottom: 10,
    paddingVertical: 6,
    backgroundColor: 'white',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    marginHorizontal: 5,
  },
  backgroundTop: {
    position: 'absolute',
    top: 0,
    width: '110%',
    height: '6%',
    backgroundColor: '#004F98',  // Adjust color as needed
    margin: -10,
  },
});
