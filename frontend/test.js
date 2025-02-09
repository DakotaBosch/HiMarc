const axios = require('axios');  // Use axios for API requests

// Function to fetch and flatten train data
const fetchAndFlattenTrains = async () => {
  try {
    const response = await axios.get('http://localhost:3000/trains');
    const data = response.data;

    console.log(data);

  } catch (error) {
    console.error('Error fetching train data:', error);
  }
};

// Call the function to fetch and print train data
fetchAndFlattenTrains();

