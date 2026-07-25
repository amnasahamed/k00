const fs = require('fs');
const axios = require('axios');

// Read the converted backup file
const backupData = JSON.parse(fs.readFileSync('./converted_backup.json', 'utf8'));

async function importData() {
  try {
    console.log('Starting data import...');
    
    // Import students first
    console.log(`Importing ${backupData.students.length} students...`);
    for (const student of backupData.students) {
      try {
        const response = await axios.post('http://localhost:3000/api/students', student);
        console.log(`Successfully imported student ${student.id}`);
      } catch (error) {
        console.warn(`Error importing student ${student.id}:`, error.message);
      }
    }
    
    // Import writers next
    console.log(`Importing ${backupData.writers.length} writers...`);
    for (const writer of backupData.writers) {
      try {
        // Remove id since it's auto-generated
        const writerData = { ...writer };
        delete writerData.id;
        
        const response = await axios.post('http://localhost:3000/api/writers', writerData);
        console.log(`Successfully imported writer with ID ${response.data.id}`);
      } catch (error) {
        console.warn(`Error importing writer:`, error.message);
      }
    }
    
    // Import assignments last
    console.log(`Importing ${backupData.assignments.length} assignments...`);
    for (const assignment of backupData.assignments) {
      try {
        const response = await axios.post('http://localhost:3000/api/assignments', assignment);
        console.log(`Successfully imported assignment ${assignment.id}`);
      } catch (error) {
        console.warn(`Error importing assignment ${assignment.id}:`, error.message);
      }
    }
    
    console.log('Data import completed!');
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importData();