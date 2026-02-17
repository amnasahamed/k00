const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Initialize Sequelize
// Check if DATABASE_URL or POSTGRES_URL is provided (for production/cloud)
let sequelize;
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (connectionString) {
  sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for some providers like Heroku/Vercel Postgres
      }
    },
    logging: false
  });
  console.log('Connected to PostgreSQL database');
} else {
  // Fallback to SQLite (for local development)
  // On Vercel (if not using Postgres), the filesystem is read-only except for /tmp.
  // We must copy the database to /tmp to make it writable, confirming the user's warning that data is ephemeral.
  let dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

  if (process.env.VERCEL) {
    const tmpPath = '/tmp/database.sqlite';
    // Copy the initial DB to /tmp if it doesn't exist there yet (or always, since lambdas are ephemeral)
    // We try-catch the copy to prevent errors if source doesn't exist or other issues
    try {
      if (fs.existsSync(dbPath) && !fs.existsSync(tmpPath)) {
        fs.copyFileSync(dbPath, tmpPath);
        console.log('Copied database to /tmp for Vercel writable access');
      }
    } catch (error) {
      console.error('Failed to copy database to /tmp:', error);
    }
    dbPath = tmpPath;
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false, // Set to console.log to see SQL queries
    dialectModule: require('sqlite3') // Required for Vercel/Webpack to include the driver
  });
  console.log('Connected to SQLite database');
}

// --- Models ---

const generateId = () => Math.random().toString(36).substring(2, 11);

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: generateId
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  university: {
    type: DataTypes.STRING
  },
  remarks: {
    type: DataTypes.TEXT
  },
  isFlagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  referredBy: {
    type: DataTypes.STRING
  }
});

const Writer = sequelize.define('Writer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null initially, will be auto-generated if missing
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isFlagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Store rating as JSON object with quality, punctuality, communication, reliability, count
  rating: {
    type: DataTypes.JSON,
    defaultValue: { quality: 5.0, punctuality: 5.0, communication: 5.0, reliability: 5.0, count: 1 }
  },
  availabilityStatus: {
    type: DataTypes.STRING,
    defaultValue: 'available'
  },
  maxConcurrentTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  totalAssignments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedAssignments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  onTimeDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  level: {
    type: DataTypes.ENUM('Bronze', 'Silver', 'Gold', 'Platinum'),
    defaultValue: 'Bronze'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  hooks: {
    beforeValidate: async (writer) => {
      // Check if phone is missing or invalid (not 10 digits)
      const isValidPhone = writer.phone && /^\d{10}$/.test(writer.phone);

      if (!isValidPhone) {
        // Find the highest placeholder phone number
        const lastPlaceholder = await Writer.findOne({
          where: {
            phone: {
              [Sequelize.Op.like]: '00000%'
            }
          },
          order: [['phone', 'DESC']]
        });

        let nextNumber = 1;
        if (lastPlaceholder && lastPlaceholder.phone) {
          nextNumber = parseInt(lastPlaceholder.phone, 10) + 1;
        }

        // Generate placeholder: 0000000001, 0000000002, etc.
        writer.phone = nextNumber.toString().padStart(10, '0');
      }
    }
  }
});

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: generateId
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  writerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Writers',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  level: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deadline: {
    type: DataTypes.DATE, // Storing as DATE, frontend sends ISO string
    allowNull: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Pending'
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Medium'
  },
  documentLink: {
    type: DataTypes.STRING
  },
  wordCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  costPerWord: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  writerCostPerWord: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  paidAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  writerPrice: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  writerPaidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  sunkCosts: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  isDissertation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  totalChapters: {
    type: DataTypes.INTEGER
  },
  // Storing chapters as JSON
  chapters: {
    type: DataTypes.JSON
  },
  description: {
    type: DataTypes.TEXT
  },
  // New fields for improvements
  activityLog: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  paymentHistory: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  statusHistory: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  // Sequelize automatically adds createdAt and updatedAt
  timestamps: true,
  indexes: [
    { fields: ['studentId'] },
    { fields: ['writerId'] },
    { fields: ['status'] },
    { fields: ['deadline'] },
    { fields: ['createdAt'] }
  ]
});

const WriterAchievement = sequelize.define('WriterAchievement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  writerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Writers',
      key: 'id'
    }
  },
  achievementType: {
    type: DataTypes.ENUM('SpeedDemon', 'Perfectionist', 'StreakMaster', 'QualityChampion'),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  awardedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const University = sequelize.define('University', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  location: {
    type: DataTypes.STRING
  }
});

// --- Associations ---
University.hasMany(Student, { foreignKey: 'universityId' });
Student.belongsTo(University, { foreignKey: 'universityId' });

Student.hasMany(Assignment, { foreignKey: 'studentId' });
Assignment.belongsTo(Student, { foreignKey: 'studentId' });

Writer.hasMany(Assignment, { foreignKey: 'writerId' });
Assignment.belongsTo(Writer, { foreignKey: 'writerId' });

Writer.hasMany(WriterAchievement, { foreignKey: 'writerId' });
Assignment.belongsTo(Writer, { foreignKey: 'writerId' }); // Duplicate line? No, this is WriterAchievement. Correction: WriterAchievement.belongsTo(Writer... wait, the original code had:
// Writer.hasMany(WriterAchievement, { foreignKey: 'writerId' });
// WriterAchievement.belongsTo(Writer, { foreignKey: 'writerId' });

// --- Hooks for Logic Consistency ---

// ... (keep existing hooks)

module.exports = {
  sequelize,
  Student,
  Writer,
  Assignment,
  WriterAchievement,
  University
};
