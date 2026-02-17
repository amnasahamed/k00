const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Check if column exists first to avoid error
    db.run("ALTER TABLE Assignments ADD COLUMN completedAt DATETIME;", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column 'completedAt' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Successfully added column 'completedAt' to Assignments table.");
        }
    });
});

db.close();
