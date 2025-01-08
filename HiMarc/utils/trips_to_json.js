//import RNFS from 'react-native-fs'; //removed because cant run in cli?
const RNFS = require('react-native-fs');
/**
 * Function to read a .txt file from a local file path and convert its contents to JSON.
 * @param {string} filePath - Path to the .txt file.
 * @returns {Promise<array>} - A promise that resolves to the JSON data.
 */
const convertToJSON = async (filePath) => {
    try {
        const data = await RNFS.readFile(filePath, 'utf8');

        const lines = data.split('\n');
        const headers = lines[0].split(',');

        const jsonData = lines.slice(1).map(line => {
            const values = line.split(',');
            let entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index];
            });
            return entry;
        });

        return jsonData;
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
};

// Example usage:
const filePath = RNFS.DocumentDirectoryPath + '/trips.txt'; // Replace with your actual file path
convertToJSON(filePath)
    .then(jsonData => {
        console.log('Converted JSON Data:', JSON.stringify(jsonData, null, 2));
    })
    .catch(err => {
        console.error('Error:', err);
    });

