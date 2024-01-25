const axios = require('axios');
const fs = require('fs');
const csvParser = require('csv-parser');
const MongoClient = require('mongodb').MongoClient;

// Replace the date with the desired date (e.g., '250124' for January 25, 2024)
const date = '120124';
const zipUrl = `https://www.bseindia.com/download/BhavCopy/Equity/EQ${date}_CSV.ZIP`;
const csvFilePath = `EQ${date}_CSV.csv`;
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'bhavcopy';

// Download the ZIP file
axios.get(zipUrl, { responseType: 'stream' })
  .then(response => {
    const zipWriter = fs.createWriteStream('EQ${date}_CSV.zip');
    response.data.pipe(zipWriter);
    zipWriter.on('finish', () => {
      console.log('ZIP file downloaded successfully');
      // Extract the ZIP file
      const extractZip = require('extract-zip');
      extractZip('EQ${date}_CSV.zip', {}, err => {
        if (err) {
          console.error('Error extracting ZIP file:', err);
          return;
        }
        console.log('ZIP file extracted successfully');
        // Read the CSV file
        const csvData = [];
        fs.createReadStream(csvFilePath)
          .pipe(csvParser())
          .on('data', row => {
            csvData.push(row);
          })
          .on('end', () => {
            console.log('CSV file read successfully');
            // Store the data in MongoDB or SQL database
            const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });
            client.connect(err => {
              if (err) {
                console.error('Error connecting to MongoDB:', err);
                return;
              }
              console.log('Connected to MongoDB');
              const db = client.db(dbName);
              const collection = db.collection('bhavcopy');
              collection.insertMany(csvData, (err, res) => {
                if (err) {
                  console.error('Error inserting data into MongoDB:', err);
                  return;
                }
                console.log(`Inserted ${csvData.length} documents into MongoDB`);
                client.close();
              });
            });
          });
      });
    });
  })
  .catch(error => {
    console.error('Error downloading ZIP file:', error);
  });
