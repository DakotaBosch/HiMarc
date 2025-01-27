import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const TrainDetails = () => {
  const { trainData } = useLocalSearchParams();
  const [parsedTrainData, setParsedTrainData] = useState(null);

  useEffect(() => {
    if (trainData) {
      try {
        // Deserialize the trainData string back into an object
        console.log("trainData:", trainData);
        const parsedData = JSON.parse(decodeURIComponent(trainData));

        // Log the structure of the parsed data (first level)
        console.log("Parsed TrainData structure:", Object.keys(parsedData));

        setParsedTrainData(parsedData);
      } catch (error) {
        console.error("Error parsing trainData:", error);
        setParsedTrainData(null); // You can adjust this to set an error state if needed
      }
    }
  }, [trainData]);

  return (
    <View>
      {parsedTrainData ? (
        <>
          <Text>Trip ID: {parsedTrainData?.trip_id}</Text>
          {/* Render other details from parsedTrainData */}
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

export default TrainDetails;

