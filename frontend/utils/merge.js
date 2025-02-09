const convertToJSON = require('./csv_to_json.js');
const fetchstatus = require('./status.js');
const stopfetch = require('./schedule_to_json');
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

let train_info;
let line_info;
let stop_info;
let calendar_info;
let schedule_info;

// Combine all data-loading calls into one Promise.all block
(async () => {
  // These four calls run concurrently:
  [train_info, line_info, calendar_info, stop_info] = await Promise.all([
    convertToJSON(1),
    convertToJSON(2),
    convertToJSON(3),
    convertToJSON(4)
  ]);
  // Then load schedule_info separately (if it depends on nothing else)
  schedule_info = await stopfetch();
})();

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
    // Handle the decoded data and get the largest stops

    if (!entityData) {
      return 0;
    }

    const largestStops = entityData.map(entity => getLargestTimeStop(entity));

    // Format the data for the TrainCard component
    const formattedTrainData = largestStops.map(stop => ({
      trip_id: `${stop.trip_id}`,
      delay: isNaN(stop.delay) || stop.delay < 30 ? 'On Time' : `${Math.round(stop.delay / 60)} min delay`,
    }));

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

  if (TrainDelay != 0) {
    mergedDataTransient = mergeArraysByPrimaryKey_LeftJoin(entityArray, TrainDelay, 'trip_id');
  } else {
    mergedDataTransient = entityArray;
  }
  const transData = mergeArraysByPrimaryKey(mergedDataTransient, TrainLine, 'route_id');
  const mergedData = mergeArraysByPrimaryKey(transData, Trainschedule, 'trip_id');
  const mergedData2 = mergeArraysByPrimaryKey_LeftJoin(mergedData, TrainCalendar, 'service_id');
  const mergedData3 = mergeArraysByPrimaryKey_LeftJoin_nested(mergedData2, TrainStops, 'stop_id');
  const sortedData = filterPastEvents(mergedData3);

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
      trip.completionPercentage = 96;
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

  return sortedData;
}

function filterPastEvents(events) {
  const currentTime = new Date().getTime() - new Date().setHours(0, 0, 0, 0);
  const BufferInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  return events.filter(event => {
    // Parse the end_time as a date and get the time in milliseconds
    const endTime = convertTimeToMilliseconds(event.end_time);

    // Get the delay in milliseconds (if present), else set it to 0
    const delay = (event.delay && !isNaN(event.delay)) ? event.delay * 1000 : 0;

    // conditions to return train
    return (endTime + delay >= currentTime) && (endTime <= currentTime + BufferInMilliseconds) && isEventToday(event);
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
  // Calculate the total milliseconds
  return hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
}

if (require.main === module) {
  main();
}

module.exports = main;

