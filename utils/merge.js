const convertToJSON = require('./csv_to_json.js');
const fetchstatus = require('./status.js');
const stopfetch = require('./schedule_to_json')
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

let train_info;
let line_info;
let stop_info;
let calendar_info;
let schedule_info;

async function getTrainInfo() {
  train_info = await convertToJSON(1);
}

async function getLineInfo() {
  line_info= await convertToJSON(2);
}

async function getScheduleInfo() {
  schedule_info = await stopfetch();
}

async function getCalendarInfo() {
  calendar_info = await convertToJSON(3);
}

async function getStopInfo() {
  stop_info = await convertToJSON(4);
}

getStopInfo();
getTrainInfo();
getLineInfo();
getScheduleInfo();
getCalendarInfo();

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
      delay: isNaN(stop.delay) || stop.delay < 30 ? 'On Time' : `${Math.round(stop.delay / 60)} min delay`,
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


function mergeArraysByPrimaryKey(array1, array2, key) {
  return array1
    .map(item1 => {
      const match = array2.find(item2 => item2[key] === item1[key]);
      return match ? { ...item1, ...match } : null;
    })
    .filter(item => item !== null); 
}


function mergeArraysByPrimaryKey_LeftJoin_nested(array1, array2, key) {
  return array1.map(item1 => {
    const updatedStops = item1.stops.map(stop => {
      const match = array2.find(item2 => {
        return stop[key] === item2[key]; // Compare them
      });
      return match ? { ...stop, ...match } : stop; // Merge or return the original stop
    });

    return {
      ...item1,
      stops: updatedStops
    };
  });
}



// Function to call fetchAndFormatData, merge data, and print the merged data
async function main() {
  const TrainDelay = await fetchAndFormatData();
  const TrainLine = await line_info;
  const entityArray = await train_info;
  const Trainschedule = await schedule_info;
  const TrainCalendar = await calendar_info;
  const TrainStops = await stop_info;

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
  const mergedData = mergeArraysByPrimaryKey(transData, Trainschedule, 'trip_id');
  //console.log(JSON.stringify(mergedData, null, 2));
   
  //console.log(JSON.stringify(TrainCalendar, null, 2));
  const mergedData2 = mergeArraysByPrimaryKey_LeftJoin(mergedData, TrainCalendar, 'service_id');
 // console.log(JSON.stringify(mergedData2, null, 2));
  
  const mergedData3 = mergeArraysByPrimaryKey_LeftJoin_nested(mergedData2, TrainStops, 'stop_id');
  //console.log(JSON.stringify(mergedData3, null, 2));
  //console.log(JSON.stringify(mergedData2, null, 2));
  const sortedData = filterPastEvents(mergedData3);
  //console.log(JSON.stringify(sortedData, null, 2));

  sortedData.forEach(trip => {
    const startTimeMS = convertTimeToMilliseconds(trip.start_time);
    const endTimeMS = convertTimeToMilliseconds(trip.end_time);
    const delayMS = isNaN(trip.delay) ? 0 : trip.delay * 60 * 1000; // Convert delay to milliseconds, handling NaN as 0
    const currentTimeMS = new Date().getTime() - new Date().setHours(0, 0, 0, 0);

    const totalTimeMS = endTimeMS - startTimeMS + delayMS;
    let elapsedTimeMS = Math.max(currentTimeMS - startTimeMS, 0); // Ensure non-negative
    
    if (startTimeMS >= currentTimeMS) {
      elapsedTimeMS = 0;
    }

    trip.completionPercentage = (elapsedTimeMS / totalTimeMS) * 100;
  
    if (trip.completionPercentage < 2) {
      trip.completionPercentage = 2;
    } else if (trip.completionPercentage > 96) {
      trip.completionPerecentage = 96;
    }

    });

    sortedData.sort((a, b) => {
      // Sort by completion percentage in descending order
      if (b.completionPercentage !== a.completionPercentage) {
        return b.completionPercentage - a.completionPercentage;
      }
      // If completion percentages are equal, sort by start time in ascending order
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
  
 
  //console.log(JSON.stringify(sortedData, null, 2));

  return sortedData;
}


function filterPastEvents(events) {
  //const currentTime = new Date().getTime(); // Get the current time in milliseconds
  const currentTime = new Date().getTime() - new Date().setHours(0, 0, 0, 0);
  const BufferInMilliseconds = 8 * 60 * 60 * 1000; // 10 hours in milliseconds

  return events.filter(event => {
    //console.log(event.end_time);
    // Parse the end_time as a date and get the time in milliseconds
    const endTime = convertTimeToMilliseconds(event.end_time);

    // Get the delay in milliseconds (if present), else set it to 0
    const delay = (event.delay && !isNaN(event.delay)) ? event.delay * 1000 : 0;
 
    //console.log(event.trip_id, currentTime, endTime, delay, isEventToday(event));
    
    // conditions to return train
    return (endTime + delay >= currentTime) && (endTime <= currentTime + BufferInMilliseconds)&&  isEventToday(event);
  });
}

function isEventToday(event) {
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = daysOfWeek[new Date().getDay()];
  return event[today] === "1";
}


function convertTimeToMilliseconds(timeString) {
  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Convert hours, minutes, and seconds to milliseconds
  const hoursInMilliseconds = hours * 60 * 60 * 1000;
  const minutesInMilliseconds = minutes * 60 * 1000;
  const secondsInMilliseconds = seconds * 1000;

  // Calculate the total milliseconds
  const totalMilliseconds = hoursInMilliseconds + minutesInMilliseconds + secondsInMilliseconds;

  return totalMilliseconds;
}




if (require.main === module) {
  main();
}

module.exports = main;

