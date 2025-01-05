// Import the https and fs modules
const https = require('https');
const fs = require('fs');

// Define the API URL
const url = 'https://geodata.md.gov/imap/rest/services/Transportation/MD_Transit/FeatureServer/11/query?where=1%3D1&outFields=Line_Statu,Tunnel,Direction,Miles,OBJECTID,Trans_Mode&outSR=4326&f=json';

// Make the GET request
https.get(url, (res) => {
    let data = '';

    // Listen for data chunks
    res.on('data', (chunk) => {
        data += chunk;
    });

    // Once the response ends, parse the JSON data and save it to a file
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);  // Parse JSON data

            // Write the JSON data to a txt file
            fs.writeFile('output.txt', JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    console.error("Error writing to file:", err);
                } else {
                    console.log("Data successfully written to output.txt");
                }
            });
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });
}).on('error', (err) => {
    console.error("Error with the request:", err);
});
