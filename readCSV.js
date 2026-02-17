const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, 'data.csv');

fs.readFile(csvFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading CSV file:', err);
    return;
  }
  const lines = data.split('\n');
  lines.forEach(line => {
    const fields = line.split(',');
    console.log(fields);
  });
});