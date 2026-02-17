const axios = require('axios');

async function clearDatabase() {
  try {
    console.log('Clearing database...');
    const response = await axios.post('http://localhost:3000/api/clear-all');
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

clearDatabase();