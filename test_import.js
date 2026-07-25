const fs = require('fs');
const axios = require('axios');

// Read the converted backup file
const backupData = JSON.parse(fs.readFileSync('./converted_backup.json', 'utf8'));

async function testImport() {
  try {
    console.log('Testing import with a single student...');
    
    // Test with just one student
    const student = backupData.students[0];
    console.log('Student data:', JSON.stringify(student, null, 2));
    
    try {
      const response = await axios.post('http://localhost:3000/api/students', student);
      console.log('Success! Imported student:', response.data);
    } catch (error) {
      console.log('Error importing student:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
      console.log('Message:', error.message);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImport();