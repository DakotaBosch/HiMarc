const convertToJSON = require('./csv_to_json.js');
const fetchstatus = require('./status.js');
const FileSystem = require('expo-file-system');

let train_info;

const filePath = '${FileSystem.documentDirectory}trips.txt';

convertToJSON(filePath)
  .then(jsonData => {
    train_info = jsonData;
    console.log('Converted JSON Data:', JSON.stringify(jsonData, null, 2));
   }) 
   .catch(err => {
     console.error('Error:', err); 
  });


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

//function mergeArraysByPrimaryKey(arr1, arr2, key) {
//  const map = new Map();
//  
//  arr1.forEach(item => map.set(item[key], { ...item }));
//  
//  arr2.forEach(item => {
//    if (map.has(item[key])) {
//      map.set(item[key], { ...map.get(item[key]), ...item });
//    } else {
//      map.set(item[key], { ...item });
//    }
//  });
//  
//  return Array.from(map.values());
//}


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
  const entityArray = await train_info;
  //console.log('Formatted Train Statuses:', JSON.stringify(TrainDelay, null, 2));
  //console.log('Train Info:', JSON.stringify(entityArray, null, 2));
  
  const mergedData = mergeArraysByPrimaryKey(entityArray, TrainDelay, 'trip_id');
  console.log('Merged Data:', JSON.stringify(mergedData, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = mergeArraysByPrimaryKey;
