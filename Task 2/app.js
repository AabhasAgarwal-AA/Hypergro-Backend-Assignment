const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const AdmZip = require("adm-zip");
const fs = require("fs");
const csv = require("csv-parser");

const app = express();
const PORT = process.env.PORT || 3000;

let stocks = [];
let favoriteStocks = [];

app.use(bodyParser.json());

async function downloadAndParseCSV() {
  try {
    const response = await axios.get(
      "https://www.bseindia.com/download/BhavCopy/Equity/EQ120124_CSV.ZIP",
      { responseType: "arraybuffer" }
    );
    const zip = new AdmZip(response.data);
    const zipEntries = zip.getEntries();
    const csvFileName = zipEntries[0].entryName;

    zip.extractAllTo(".", true);

    const csvData = fs.readFileSync(csvFileName, "utf8");

    return new Promise((resolve, reject) => {
      const parsedData = [];
      fs.createReadStream(csvFileName)
        .pipe(csv())
        .on("data", (row) => {
          parsedData.push(row);
        })
        .on("end", () => {
          resolve(parsedData);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  } catch (error) {
    throw error;
  }
}

// Get top 10 stocks
app.get("/api/stocks/top10", async (req, res) => {
  try {
    if (stocks.length === 0) {
      stocks = await downloadAndParseCSV();
    }

    const top10Stocks = stocks.slice(0, 10);
    res.json(top10Stocks);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching data from BSE India." });
  }
});

// Get stocks by name
app.get('/api/stocks/:name', (req, res) => {
  const stockName = req.params.name.toLowerCase();
  const matchedStocks = stocks.filter(stock => stock.name.toLowerCase().includes(stockName));
  res.json(matchedStocks);
});

// Get stock price history list for UI graph
app.get('/api/stocks/:id/history', (req, res) => {
  const stockId = parseInt(req.params.id);
  // Fetch and return price history for the given stock ID (replace with actual implementation)
  // For demonstration, return a sample response
  res.json({ stockId, history: [/* price history array */] });
});

// Add a stock to favorites
app.post('/api/favorites', (req, res) => {
  const { id } = req.body;
  const stockToAdd = stocks.find(stock => stock.id === id);

  if (stockToAdd) {
    favoriteStocks.push(stockToAdd);
    res.status(201).json({ success: true, message: 'Stock added to favorites.' });
  } else {
    res.status(404).json({ success: false, message: 'Stock not found.' });
  }
});

// Get favorite stocks
app.get('/api/favorites', (req, res) => {
  res.json(favoriteStocks);
});

// Remove a stock from favorites
app.delete('/api/favorites/:id', (req, res) => {
  const stockIdToRemove = parseInt(req.params.id);
  favoriteStocks = favoriteStocks.filter(stock => stock.id !== stockIdToRemove);
  res.json({ success: true, message: 'Stock removed from favorites.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
