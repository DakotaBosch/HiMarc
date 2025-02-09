const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const protobuf = require('protobufjs');
const https = require('https'); // Use https module
const axios = require('axios');
const admzip = require('adm-zip');
const csvtojson = require('csvtojson');  // CSV to JSON converter

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

async function FormatData(entityData) {
  try {
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

const app = express();
app.use(express.json());
app.use(require('cors')());

const DATA_DIR = path.join(__dirname, 'data');
fs.ensureDirSync(DATA_DIR); // Ensure the data directory exists

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
      const calendarDates = dailyData.calendar_dates.filter(cd => cd.service_id === trip.service_id);
      const calendar = dailyData.calendar.find(c => c.service_id === trip.service_id);
      const route = dailyData.routes.find(r => r.route_id === trip.route_id);

      return {
        ...trip,
        stop_times: stops,
        calendar_dates: calendarDates,
        calendar: calendar,
        route: route
      };
    });

    // Save the joined data to a JSON file
    await saveData('daily_data.json', joinedData);
    console.log('Daily data processed and saved.');
  } catch (error) {
    console.error('Error processing daily data:', error);
  }
};

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
  const trains = await loadData('trains.json');
  res.json(trains);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

