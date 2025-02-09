const axios = require('axios');  // Use axios for API requests

// Function to fetch and flatten train data
const fetchAndFlattenTrains = async () => {
  try {
    const response = await axios.get('http://localhost:3000/trains');
    const data = response.data;

    // Flatten data (assuming nested structures)
    const flattenedData = data.map(train => ({
      trip_id: train.trip_id,
      delay: train.delay,
      // Add more fields if needed
    }));

    console.log('Flattened Train Data:', JSON.stringify(flattenedData, null, 2));
    return flattenedData;
  } catch (error) {
    console.error('Error fetching train data:', error);
  }
};

// Call the function to fetch and print train data
fetchAndFlattenTrains();

