const fs = require('fs');
const axios = require('axios');

// Read the converted backup file
const backupData = JSON.parse(fs.readFileSync('./converted_backup.json', 'utf8'));

async function smartImport() {
  try {
    console.log('Starting smart data import...');
    
    // Import students first
    console.log(`Importing ${backupData.students.length} students...`);
    const importedStudents = [];
    for (const student of backupData.students) {
      try {
        const response = await axios.post('http://localhost:3000/api/students', student);
        importedStudents.push(response.data);
        console.log(`Successfully imported student ${student.id}`);
      } catch (error) {
        console.warn(`Error importing student ${student.id}:`, error.message);
      }
    }
    
    // Import writers next
    console.log(`Importing ${backupData.writers.length} writers...`);
    const importedWriters = [];
    const writerIdMap = {}; // Map old IDs to new IDs
    
    // We need to preserve the original writer IDs from the backup data
    // Let's read the original backup to get the writer IDs
    const originalBackup = JSON.parse(fs.readFileSync('./frontend/components/taskmaster_backup_2025-12-15 (2).json', 'utf8'));
    
    for (let i = 0; i < backupData.writers.length; i++) {
      const writer = backupData.writers[i];
      const originalWriter = originalBackup.writers[i]; // Get the original writer with its ID
      
      try {
        // Store the old ID before removing it
        const oldId = originalWriter.id;
        
        // Remove id since it's auto-generated
        const writerData = { ...writer };
        delete writerData.id;
        
        const response = await axios.post('http://localhost:3000/api/writers', writerData);
        importedWriters.push(response.data);
        
        // Map old ID to new ID
        if (oldId) {
          writerIdMap[oldId] = response.data.id;
        }
        
        console.log(`Successfully imported writer with new ID ${response.data.id}`);
      } catch (error) {
        console.warn(`Error importing writer:`, error.message);
      }
    }
    
    console.log('Writer ID mapping:', writerIdMap);
    
    // Import assignments last, with updated writer IDs
    console.log(`Importing ${backupData.assignments.length} assignments...`);
    const importedAssignments = [];
    
    for (const assignment of backupData.assignments) {
      try {
        // Update writerId if it exists in the mapping
        const assignmentData = { ...assignment };
        if (assignmentData.writerId && writerIdMap[assignmentData.writerId]) {
          assignmentData.writerId = writerIdMap[assignmentData.writerId];
        }
        
        const response = await axios.post('http://localhost:3000/api/assignments', assignmentData);
        importedAssignments.push(response.data);
        console.log(`Successfully imported assignment ${assignment.id}`);
      } catch (error) {
        console.warn(`Error importing assignment ${assignment.id}:`, error.message);
        console.warn('Assignment data:', JSON.stringify(assignment, null, 2));
      }
    }
    
    console.log('Data import completed!');
    console.log(`Imported ${importedStudents.length} students, ${importedWriters.length} writers, ${importedAssignments.length} assignments`);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
smartImport();