const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const protobuf = require('protobufjs');
const https = require('https'); // Use https module
const axios = require('axios');
const admzip = require('adm-zip');
const csvtojson = require('csvtojson');  // CSV to JSON converter
const { Expo } = require('expo-server-sdk'); // Add Expo SDK for push notifications
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('subscriptions.db');

const app = express();
app.use(express.json());
app.use(require('cors')());

const DATA_DIR = path.join(__dirname, 'data');
fs.ensureDirSync(DATA_DIR); // Ensure the data directory exists

const expo = new Expo(); // Initialize Expo SDK
const subscriptions = new Map(); // Map<train_id, Set<push_token>>

// Helper function to get the largest time stop
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

// Helper function to format train data
async function FormatData(entityData) {
  try {
    if (!entityData) {
      return 0;
    }

    const largestStops = entityData.map(entity => getLargestTimeStop(entity));

    // Format the data for the TrainCard component
    const formattedTrainData = largestStops.map(stop => ({
      trip_id: `${stop.trip_id}`,
      delay: stop.delay,
      delay_formatted: isNaN(stop.delay) || stop.delay < 30 ? 'On Time' : `${Math.round(stop.delay / 60)} min delay`,
    }));

    return formattedTrainData;
  } catch (error) {
    console.error('Error fetching or processing data:', error);
  }
}

// Load JSON data helper
const loadData = async (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    return await fs.readJson(filePath);
  } catch (err) {
    return []; // Return empty array if file doesn't exist
  }
};

// Save JSON data helper
const saveData = async (filename, data) => {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeJson(filePath, data, { spaces: 2 });
};

// Fetch and decode GTFS-RT data using https module
const fetchAndDecodeGTFSRT = async () => {
  try {
    // Fetch the GTFS-RT protobuf schema file
    const schemaUrl = 'https://raw.githubusercontent.com/google/transit/master/gtfs-realtime/proto/gtfs-realtime.proto';
    const schemaText = await fetchText(schemaUrl);

    // Load the schema dynamically
    const root = protobuf.parse(schemaText, { keepCase: true }).root;
    const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

    // Fetch the real-time trip updates (GTFS-RT data)
    const feedUrl = 'https://mdotmta-gtfs-rt.s3.amazonaws.com/MARC+RT/marc-tu.pb';
    const buffer = await fetchBinary(feedUrl);

    // Decode the GTFS-RT data
    const feedMessage = FeedMessage.decode(new Uint8Array(buffer));
    const feedMessageObject = FeedMessage.toObject(feedMessage, {
      enums: String,
      longs: String,
      bytes: String,
    });

    const formattedData = await FormatData(feedMessageObject.entity);
    // Return the decoded data as a JavaScript object
    return formattedData;
  } catch (error) {
    console.error('Error fetching and decoding GTFS-RT data:', error);
    throw error;
  }
};

// Daily task to fetch ZIP, unzip, and convert CSVs to JSON
const fetchAndProcessDailyData = async () => {
  try {
    const zipUrl = 'https://feeds.mta.maryland.gov/gtfs/marc'; // Change to your URL
    const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });

    const validTxtFiles = [
        "stop_times.txt",
        "stops.txt",
        "calendar.txt",
        "routes.txt",
        "trips.txt",
        "calendar_dates.txt"
    ];

    // Unzip the downloaded file
    const zip = new admzip(response.data);
    const outputDir = path.join(DATA_DIR, 'daily_data');
    zip.extractAllTo(outputDir, true); // Extract ZIP contents to directory

    // Process CSV files in the directory and convert to JSON
    const files = fs.readdirSync(outputDir);
    let dailyData = {};

    for (const file of files) {
      if (validTxtFiles.includes(file)) {
        const csvFilePath = path.join(outputDir, file);
        const jsonData = await csvtojson().fromFile(csvFilePath);
        dailyData[file.replace('.txt', '')] = jsonData; // Store data in an object with file names as keys
      }
    }

    // Perform the joins
    const joinedData = dailyData.trips.map(trip => {
      const stopTimes = dailyData.stop_times.filter(st => st.trip_id === trip.trip_id);
      const stops = stopTimes.map(st => {
        const stop = dailyData.stops.find(s => s.stop_id === st.stop_id);
        return { ...st, ...stop };
      });

      // Get the first and last stop times
      const start_time = stops.length > 0 ? stops[0].departure_time : null; // Take departure_time from first stop
      const end_time = stops.length > 0 ? stops[stops.length - 1].arrival_time : null; // Take arrival_time from last stop

      // Format the short versions of the times
      const start_time_short = formatTimeShort(start_time);
      const end_time_short = formatTimeShort(end_time);

      const calendarDates = dailyData.calendar_dates.filter(cd => cd.service_id === trip.service_id);
      const calendar = dailyData.calendar.find(c => c.service_id === trip.service_id);
      const route = dailyData.routes.find(r => r.route_id === trip.route_id);

      return {
        ...trip,
        ...calendar,
        ...route,
        start_time,
        start_time_short,
        end_time,
        end_time_short,
        service_exceptions: calendarDates,
        stops,
      };
    });

    // Save the joined data to a JSON file
    await saveData('daily_data.json', joinedData);
    console.log('Daily data processed and saved.');
  } catch (error) {
    console.error('Error processing daily data:', error);
  }
};

// Helper function to convert "HH:MM:SS" to "h:mm AM/PM"
function formatTimeShort(time) {
  if (!time) return null;

  // Split the time into hours, minutes, and seconds
  const [hours, minutes] = time.split(':');

  // Convert hours to a number
  let hour = parseInt(hours, 10);

  // Determine AM/PM
  const ampm = hour >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  hour = hour % 12 || 12; // Handle midnight (0 becomes 12)

  // Format the time as "h:mm AM/PM"
  return `${hour}:${minutes} ${ampm}`;
}

// Helper function to fetch text data (e.g., schema file)
const fetchText = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Helper function to fetch binary data (e.g., GTFS-RT feed)
const fetchBinary = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      res.on('end', () => {
        resolve(Buffer.concat(data));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Set interval to fetch and save GTFS-RT data every 10 seconds
setInterval(async () => {
  console.log('Fetching and decoding train data...');
  try {
    const decodedData = await fetchAndDecodeGTFSRT();
    await saveData('trains.json', decodedData); // Save the decoded data to file
    console.log('Train data updated and saved');
  } catch (error) {
    console.error('Error fetching and saving train data:', error);
  }
}, 60 * 1000); // Fetch every 60 seconds

// Schedule daily task (run at midnight or at a specific time each day)
const dailyTaskInterval =  60 * 1000; // Every hour
setInterval(fetchAndProcessDailyData, dailyTaskInterval); // Set the daily interval

// Route to serve stored train data
app.get('/trains', async (req, res) => {
  try {
    // Load the data from the JSON files
    const dailyData = await loadData('daily_data.json'); // Array of objects
    const trainData = await loadData('trains.json'); // Array of objects

    const correctTrainData = Array.isArray(trainData) ? trainData : [];  // Default to empty array if not an array

    // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDayOfWeek = new Date().getDay();
    const weekdayFields = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentWeekdayField = weekdayFields[currentDayOfWeek];

    // Perform a left join on trip_id
    const joinedData = dailyData.map(trip => {
      // Find matching train info (if it exists)
      const trainInfo = correctTrainData.find(train => train.trip_id === trip.trip_id);

      // If trainInfo exists, merge it into the trip object; otherwise, just return the trip object
      const combinedTrip = trainInfo ? { ...trip, ...trainInfo } : trip;

      // Add completion_percent calculation
      if (combinedTrip.start_time && combinedTrip.end_time && combinedTrip.delay !== undefined) {
        // Helper function to convert "HH:MM:SS" to timestamp (milliseconds since Unix epoch)
        const timeToTimestamp = (time) => {
          const [hours, minutes, seconds] = time.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, seconds, 0); // Set time to today's date
          return date.getTime(); // Get timestamp in milliseconds
        };

        // Convert start_time and end_time to timestamps
        const startTime = timeToTimestamp(combinedTrip.start_time);
        const endTime = timeToTimestamp(combinedTrip.end_time);

        // Get current time in milliseconds
        const currentTime = Date.now();

        // Adjust start and end times with delay (convert delay to milliseconds)
        const adjustedStartTime = startTime + combinedTrip.delay * 1000;
        const adjustedEndTime = endTime + combinedTrip.delay * 1000;

        // Calculate completion percentage
        let completionPercent = 0;

        if (currentTime < adjustedStartTime) {
          completionPercent = 0;  // If current time is before start time
        } else if (currentTime > adjustedEndTime) {
          completionPercent = 100;  // If current time is after end time
        } else {
          completionPercent = ((currentTime - adjustedStartTime) / (adjustedEndTime - adjustedStartTime)) * 100;
        }

        // Clamp the value between 0 and 100
        completionPercent = Math.max(0, Math.min(100, completionPercent));

        // Attach completion_percent to the trip object
        combinedTrip.completionPercentage = completionPercent;
      }	
      return combinedTrip;
    });


    // Filter the joinedData array
    const filteredData = joinedData.filter(trip => {
      const currentTime = new Date();
      const startTime = new Date(trip.start_time);

      // Check if the trip operates on the current day of the week
      const operatesToday = trip[currentWeekdayField] === '1';

      // Check if delay is non-NaN or start_time is within 2 hours from now
      return (
        (trip.delay !== undefined || // Non-NaN delay
        //(startTime - currentTime) <= 6 * 60 * 60 * 1000) && // Start time within 2 hours
        operatesToday) // Trip operates on the current day
      );
    });

    res.json(filteredData); // Send the filtered data as JSON response
  } catch (error) {
    console.error('Error loading or joining train data:', error);
    res.status(500).json({ error: error.message });
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_id TEXT NOT NULL,
      push_token TEXT NOT NULL,
      UNIQUE(train_id, push_token)
    )
  `);
});


app.post('/subscribe', (req, res) => {
  const { train_id, push_token } = req.body;

  if (!train_id || !push_token) {
    return res.status(400).json({ error: 'Missing train_id or push_token' });
  }

  if (!Expo.isExpoPushToken(push_token)) {
    return res.status(400).json({ error: 'Invalid push token' });
  }

  db.run(
    'INSERT OR IGNORE INTO subscriptions (train_id, push_token) VALUES (?, ?)',
    [train_id, push_token],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
});

app.post('/unsubscribe', (req, res) => {
  const { train_id, push_token } = req.body;

  if (!train_id || !push_token) {
    return res.status(400).json({ error: 'Missing train_id or push_token' });
  }

  db.run(
    'DELETE FROM subscriptions WHERE train_id = ? AND push_token = ?',
    [train_id, push_token],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
});

// Function to send push notifications
async function sendPushNotification(train) {
  const messages = [];
  const pushTokens = subscriptions.get(train.trip_id) || [];

  for (const token of pushTokens) {
    if (!Expo.isExpoPushToken(token)) {
      console.error(`Invalid push token: ${token}`);
      continue;
    }

    messages.push({
      to: token,
      sound: 'default',
      title: 'Train Delay Alert',
      body: `Train ${train.trip_id} is delayed by ${train.delay} minutes.`,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push notifications sent:', receipts);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }
}

// Function to check for delays and send notifications
async function checkForDelays() {
  try {
    const trains = await fetchAndDecodeGTFSRT();

    if (!trains.length) {
      console.log('GTFSRT data is empty');
      return; // Exit early if no trains
    }
    for (const train of trains) {
      if (train.delay >= 5) {
        await sendPushNotification(train);
      }
    }
  } catch (error) {
    console.error('Error checking for delays:', error);
  }
}

// Periodically check for delays
setInterval(checkForDelays, 60 * 1000); // Check every minute

// Start the server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
