// Import the https module
const https = require('https');

// Define the API URL
const url = 'https://geodata.md.gov/imap/rest/services/Transportation/MD_Transit/FeatureServer/11/query?where=1%3D1&outFields=Line_Statu,Tunnel,Direction,Miles,OBJECTID,Trans_Mode&outSR=4326&f=json';

// Make the GET request
https.get(url, (res) => {
    let data = '';

    // Listen for data chunks
    res.on('data', (chunk) => {
        data += chunk;
    });

    // Once the response ends, parse the JSON data
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);  // Parse JSON data
            console.log(jsonData);  // Output the parsed JSON data
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });
}).on('error', (err) => {
    console.error("Error with the request:", err);
});
