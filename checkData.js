const fs = require('fs');
const csv = require('csv-parser');

const filePath = 'Bank_Transaction_Fraud_Detection.csv';//file name of tht 2L

const results = [];

fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log("✅ CSV read successfully!");
    console.log("Here are the first 2 rows of your data:");
    console.log(results[0]);
    console.log(results[1]);
  });