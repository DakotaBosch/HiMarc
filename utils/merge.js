const convertToJSON = require('./csv_to_json.js');
const fetchstatus = require('./status.js');
const stopfetch = require('./stops_to_json')
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

let train_info;
let line_info;
let stop_info;

async function getTrainInfo() {
  train_info = await convertToJSON(1);
}

async function getLineInfo() {
  line_info= await convertToJSON(2);
}

async function getStopInfo() {
  stop_info = await stopfetch();
}

getTrainInfo();
getLineInfo();
getStopInfo();

function getLargestTimeStop(entity) {
  let largestTimeStop = null;
  let largestTime = -Infinity;

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

async function fetchAndFormatData() {
  try {
    const decodedData = await fetchstatus();  // Fetch and decode data from the API
    const entityData = decodedData.entity;
    //console.log(JSON.stringify(entityData, null, 2));  // Log the data for debugging
    // Handle the decoded data and get the largest stops
    
    if(!entityData){
      return 0;
    }

    const largestStops = entityData.map(entity => getLargestTimeStop(entity));

    //console.log(largestStops)

    // Format the data for the TrainCard component
    const formattedTrainData = largestStops.map(stop => ({
      trip_id: `${stop.trip_id}`,
      delay: `${Math.round(stop.delay / 60)} min delay`
    }));

    //console.log(formattedTrainData)

    return formattedTrainData;
  } catch (error) {
    console.error('Error fetching or processing data:', error);
  }
}

function mergeArraysByPrimaryKey_LeftJoin(array1, array2, key) {
  return array1.map(item1 => {
    const match = array2.find(item2 => item2[key] === item1[key]);
    return match ? { ...item1, ...match } : item1;
  });
}


//unused
function mergeArraysByPrimaryKey(array1, array2, key) {
  return array1
    .map(item1 => {
      const match = array2.find(item2 => item2[key] === item1[key]);
      return match ? { ...item1, ...match } : null;
    })
    .filter(item => item !== null); 
}

// Function to call fetchAndFormatData, merge data, and print the merged data
async function main() {
  const TrainDelay = await fetchAndFormatData();
  const TrainLine = await line_info;
  const entityArray = await train_info;
  const Trainstops = await stop_info;
  let mergedDataTransient;
  
  //console.log('TrainLine: ', JSON.stringify(TrainLine, null,2));
  //console.log('entityArray: ', JSON.stringify(entityArray, null, 2));

  //const mergedDataTransient = mergeArraysByPrimaryKey_LeftJoin(entityArray, TrainDelay, 'trip_id');
  //console.log('DelayINFO ', TrainDelay);
  if (TrainDelay !=  0) {
    mergedDataTransient = mergeArraysByPrimaryKey_LeftJoin(entityArray, TrainDelay, 'trip_id');
  // Proceed with further operations
  } else {
    //console.log('triandelay empty');
    mergedDataTransient = entityArray;
  } 
  //console.log('test');
  const transData = mergeArraysByPrimaryKey(mergedDataTransient, TrainLine, 'route_id');
  //console.log('Merged Data:s', JSON.stringify(mergedData, null, 2));
  //console.log(Trainstops);
  const mergedData = mergeArraysByPrimaryKey(transData, Trainstops, 'trip_id');
  console.log(JSON.stringify(mergedData, null, 2));
  return mergedData;
}

if (require.main === module) {
  main();
}

module.exports = main;

