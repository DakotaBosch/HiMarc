import React from 'react';

export default function FileReaderComponent() {
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

  // Function to handle file input and process the data
  export function handleFileInput(event) {
    const file = event.target.files[0]; // Get the selected file

    if (file) {
      const reader = new FileReader(); // Create a new FileReader instance

      // When the file is read successfully
      reader.onload = function () {
        try {
          // Get the content of the file as a string
          const data = reader.result;

          // Clean up the data by removing non-JSON text (if necessary)
          const jsonString = data.replace(/^Decoded GTFS-RT Trip Updates:\s*/, '').trim();

          // Parse the JSON content
          const jsonData = JSON.parse(jsonString);

          // Create an array to store results for each entity
          const largestStops = jsonData.entity.map(entity => getLargestTimeStop(entity));

          // Log the largest stops data to the console
          console.log('Largest stops data for each entity:', largestStops);
        } catch (parseError) {
          console.error('Error parsing the JSON data:', parseError);
        }
      };

      // Read the file as a text string
      reader.readAsText(file);
    } else {
      console.error('No file selected');
    }
  }

  // Return JSX with a JSX Fragment
  return (
    <>
      <input type="file" id="file-input" onChange={handleFileInput} />
    </>
  );
}

