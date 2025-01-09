const protobuf = require('protobufjs');
const fetch = require('node-fetch');

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
    //console.log(feedMessageObject)
    // Return the decoded data instead of saving it to a file
    return feedMessageObject;

  } catch (error) {
    throw error;  // Propagate error to the caller
  }
}

// Check if the script is executed directly (not imported)
if (require.main === module) {
  fetchAndDecodeGTFSRT()
    .then(data => console.log(JSON.stringify(data, null,2)))
    .catch(err => console.error(err));
}


module.exports = fetchAndDecodeGTFSRT;  // Export the function to be used in other files

