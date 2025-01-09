const convert = require('./csv_to_json.js')
const fetchstatus = require('./status.js')

const train_info = convert('./trips.txt')

let status_info;

async function fetch(){
  try{
    status_info = await fetchstatus();
  }  catch (error) {
     console.error('Error:', error);
  }
  return
}

fetch().then(() => {
  console.log(JSON.stringify(status_info, null, 2));
  console.log(train_info);
});
