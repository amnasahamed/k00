const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const columnsToAdd = [
    "ALTER TABLE Assignments ADD COLUMN isArchived BOOLEAN DEFAULT 0;",
    "ALTER TABLE Assignments ADD COLUMN activityLog TEXT DEFAULT '[]';",
    "ALTER TABLE Assignments ADD COLUMN paymentHistory TEXT DEFAULT '[]';",
    "ALTER TABLE Assignments ADD COLUMN statusHistory TEXT DEFAULT '[]';",
    "ALTER TABLE Assignments ADD COLUMN attachments TEXT DEFAULT '[]';"
];

db.serialize(() => {
    columnsToAdd.forEach(query => {
        db.run(query, (err) => {
            if (err) {
                if (err.message.includes("duplicate column name")) {
                    // ignore
                } else {
                    console.error("Error running query:", query, err.message);
                }
            } else {
                console.log("Success:", query);
            }
        });
    });
});

db.close();
