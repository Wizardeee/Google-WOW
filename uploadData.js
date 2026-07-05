const fs = require('fs');
const csv = require('csv-parser');
const db = require('./firebaseConfig');

async function uploadFullData() {
  const filePath = 'Bank_Transaction_Fraud_Detection.csv'; // Update this to your file
  let batch = db.batch();
  let count = 0;
  let totalUploaded = 0;
  let batchCount = 0;

  console.log("🚀 Starting FULL upload of 2 lakh records...");

  const stream = fs.createReadStream(filePath).pipe(csv());

  for await (const row of stream) {
    const docRef = db.collection('complaints').doc();
    
    // Optional: Data Type Fix
    // If Amount is a string, convert it to a Number
    row.Transaction_Amount = parseFloat(row.Transaction_Amount) || 0;

    batch.set(docRef, row);
    count++;
    totalUploaded++;

    if (count === 500) {
      await batch.commit();
      batchCount++;
      console.log(`✅ Uploaded batch ${batchCount} (${totalUploaded} total records)`);
      batch = db.batch(); // Reset batch
      count = 0;
    }
  }

  // Commit any remaining records
  if (count > 0) {
    await batch.commit();
  }

  console.log(`🏁 Full upload complete! Total records: ${totalUploaded}`);
}

uploadFullData();