const { sequelize, Assignment, Writer } = require('./models');
const { Op } = require('sequelize');

async function fixData() {
    try {
        console.log('Starting data consistency fix...');

        // 1. Fix NULL IDs
        // Find all assignments where ID is null (or we can iterate all and check)
        // Since Sequelize might have trouble finding by null PK, we might need raw query or careful findAll
        const allAssignments = await Assignment.findAll();

        console.log(`Found ${allAssignments.length} total assignments.`);

        for (const assignment of allAssignments) {
            if (!assignment.id || assignment.id === 'null') {
                const newId = Math.random().toString(36).substring(2, 11);
                console.log(`Fixing assignment with missing ID. Title: ${assignment.title}. New ID: ${newId}`);

                // We can't use assignment.update({id: newId}) easily if ID is PK.
                // Better to raw update or create new copy and delete old.
                // Since ID is PK, we can just run a raw UPDATE query to set the ID where it is NULL and rowid matches (if we could).
                // But since we are here, let's try to use raw query to update specific record based on other unique-ish fields?
                // Actually, if we have multiple identical records with null IDs, raw SQL updating 'id' where 'id' is null will update ALL of them to the SAME new ID if we aren't careful.

                // Strategy: Use SQLite's ROWID to identify them uniquely.
            }
        }

        // Better Strategy: RAW SQL to assign IDs to NULL entries one by one using ROWID
        // Fetch ROWIDs of records with NULL id
        const [nullIdRecords] = await sequelize.query("SELECT rowid, * FROM Assignments WHERE id IS NULL OR id = 'null'");
        console.log(`Found ${nullIdRecords.length} records with NULL IDs.`);

        for (const record of nullIdRecords) {
            const newId = Math.random().toString(36).substring(2, 11);
            console.log(`Assigning ID ${newId} to record w/ rowid ${record.rowid}`);
            await sequelize.query(`UPDATE Assignments SET id = '${newId}' WHERE rowid = ${record.rowid}`);
        }

        // 2. Deduplicate
        // Now that they have IDs, we can use Sequelize to find duplicates
        const pfixedAssignments = await Assignment.findAll();

        // Group by title + writerId
        const groups = {};
        for (const a of pfixedAssignments) {
            const key = `${a.title}|${a.writerId}|${a.studentId}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(a);
        }

        for (const key in groups) {
            const group = groups[key];
            if (group.length > 1) {
                console.log(`Found duplicate group for ${key} (${group.length} records)`);

                // prioritization: Completed > In Progress > Pending
                const score = (status) => {
                    const s = status.toLowerCase();
                    if (s === 'completed') return 3;
                    if (s === 'in progress') return 2;
                    return 1;
                };

                // Sort by score DESC, then by updatedAt DESC
                group.sort((a, b) => {
                    const scoreDiff = score(b.status) - score(a.status);
                    if (scoreDiff !== 0) return scoreDiff;
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                });

                // Keep index 0, delete others
                const toKeep = group[0];
                const toDelete = group.slice(1);

                console.log(`Keeping ${toKeep.id} (${toKeep.status}). Deleting ${toDelete.length} duplicates.`);

                for (const d of toDelete) {
                    await d.destroy(); // using destroy to trigger hooks (update writer stats)
                    console.log(`Deleted ${d.id}`);
                }
            }
        }

        console.log('Data cleanup completed.');

        // Force sync stats for all writers just in case
        const writers = await Writer.findAll();
        for (const w of writers) {
            // Trigger the stats update logic manually
            // We can't access the internal function easily, but we can trigger a save? 
            // Or we can just rely on the destroy hooks above.
            // Let's do a dummy update to trigger hooks if needed, or just let it be.
            // The hooks in models.js are bound to Assignment.afterSave/afterDestroy.
            // Since we called d.destroy(), writer stats should be updated.
        }

    } catch (error) {
        console.error('Error in cleanup:', error);
    } finally {
        // We cannot close sequelize connection easily if it's imported from models, 
        // but the script will exit.
    }
}

fixData();
