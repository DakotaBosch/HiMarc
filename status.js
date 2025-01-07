const protobuf = require('protobufjs');
const fetch = require('node-fetch');
const fs = require('fs');  // Import fs module

async function fetchAndDecodeGTFSRT() {
  try {
    // Fetch the GTFS-RT protobuf schema file from GitHub (or from another URL where the proto is hosted)
    const schemaUrl = 'https://raw.githubusercontent.com/google/transit/master/gtfs-realtime/proto/gtfs-realtime.proto';
    const schemaResponse = await fetch(schemaUrl);
    const schemaText = await schemaResponse.text();

    // Load the schema dynamically
    const root = protobuf.parse(schemaText, { keepCase: true }).root;
    const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

    // Fetch the real-time trip updates
    const feedUrl = 'https://mdotmta-gtfs-rt.s3.amazonaws.com/MARC+RT/marc-tu.pb';
    const response = await fetch(feedUrl);

    // Use arrayBuffer() instead of buffer()
    const buffer = await response.arrayBuffer();  // <-- Fixed here

    // Decode the GTFS-RT data
    const feedMessage = FeedMessage.decode(new Uint8Array(buffer));
    const feedMessageObject = FeedMessage.toObject(feedMessage, {
      enums: String,
      longs: String,
      bytes: String,
    });

    // Convert the object to a formatted string for writing to the file
    // Ensure the entity is part of the output by including the full object
    const outputData = JSON.stringify(feedMessageObject, null, 2);  // Indent for readability

    // Define the output file path
    const outputFile = 'gtfs-rt-output.txt';

    // Create a write stream to the file
    const writeStream = fs.createWriteStream(outputFile, { flags: 'w' });

    // Write the data to the file
    writeStream.write('Decoded GTFS-RT Trip Updates:\n');
    writeStream.write(outputData);  // Write the entire decoded data including 'entity'

    console.log('Data has been written to gtfs-rt-output.txt');

    // Close the write stream
    writeStream.end();

  } catch (error) {
    console.error('Error fetching or decoding GTFS-RT:', error);
  }
}

fetchAndDecodeGTFSRT();

