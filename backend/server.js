const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { sequelize, Student, Writer, Assignment, University } = require('./models');
const writerAuthRoutes = require('./routes/writerAuth');
const writerDashboardRoutes = require('./routes/writerDashboard');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
    console.warn('WARNING: ADMIN_PASSWORD is not set. Admin login will be disabled.');
}

// Validate environment variables
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
console.log(`Database path: ${DB_PATH}`);
console.log(`Server will run on port: ${PORT}`);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- Authentication Middleware ---

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// Input Filtering Utility
const filterObject = (obj, allowedFields) => {
    const filtered = {};
    Object.keys(obj).forEach(key => {
        if (allowedFields.includes(key)) {
            filtered[key] = obj[key];
        }
    });
    return filtered;
};

const STUDENT_FIELDS = ['name', 'email', 'phone', 'university', 'universityId', 'remarks', 'isFlagged', 'referredBy'];
const WRITER_FIELDS = ['phone', 'name', 'email', 'specialty', 'isFlagged', 'rating',
    'availabilityStatus', 'maxConcurrentTasks', 'totalAssignments', 'completedAssignments',
    'onTimeDeliveries', 'level', 'points', 'streak', 'lastActive'];
const ASSIGNMENT_FIELDS = [
    'studentId', 'writerId', 'title', 'type', 'subject', 'level', 'deadline', 'completedAt',
    'status', 'priority', 'documentLink', 'wordCount', 'costPerWord', 'writerCostPerWord',
    'price', 'paidAmount', 'writerPrice', 'writerPaidAmount', 'sunkCosts',
    'isDissertation', 'totalChapters', 'chapters', 'description',
    'activityLog', 'paymentHistory', 'statusHistory', 'attachments', 'isArchived'
];

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, 'dist')));

// --- API Routes ---

// Admin Login
app.post('/api/admin/login', (req, res) => {
    if (!ADMIN_PASSWORD) {
        return res.status(503).json({ error: 'Admin login is not configured' });
    }
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password required' });
    }
    if (password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: 'admin' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Writer Authentication
app.use('/api/writer-auth', writerAuthRoutes);

// Writer Dashboard (protection handled within the router if needed, but let's add basic auth here)
app.use('/api/writer-dashboard', authenticateToken, writerDashboardRoutes);

// Students
app.get('/api/students', authenticateToken, isAdmin, async (req, res) => {
    try {
        const students = await Student.findAll({ include: University });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/students', authenticateToken, isAdmin, async (req, res) => {
    try {
        const student = await Student.create(filterObject(req.body, STUDENT_FIELDS));
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/students/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Student.update(filterObject(req.body, STUDENT_FIELDS), { where: { id } });
        const updatedStudent = await Student.findByPk(id, { include: University });
        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/students/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Student.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Universities
app.get('/api/universities', authenticateToken, isAdmin, async (req, res) => {
    try {
        const universities = await University.findAll();
        res.json(universities);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/universities', authenticateToken, isAdmin, async (req, res) => {
    try {
        const university = await University.create(filterObject(req.body, ['name', 'location']));
        res.json(university);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/universities/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await University.update(filterObject(req.body, ['name', 'location']), { where: { id } });
        const updated = await University.findByPk(id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/universities/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Check associations? For now, allow delete and let FKs become null if configured or error
        // Student model `belongsTo` defaults usually just allow.
        await University.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Writers
app.get('/api/writers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const writers = await Writer.findAll();
        res.json(writers);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/writers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const writer = await Writer.create(filterObject(req.body, WRITER_FIELDS));
        res.json(writer);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/writers/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Writer.update(filterObject(req.body, WRITER_FIELDS), { where: { id } });
        const updatedWriter = await Writer.findByPk(id);
        res.json(updatedWriter);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/writers/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Writer.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Assignments
app.get('/api/assignments', authenticateToken, isAdmin, async (req, res) => {
    try {
        const assignments = await Assignment.findAll();
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/assignments', authenticateToken, isAdmin, async (req, res) => {
    try {
        const payload = filterObject(req.body, ASSIGNMENT_FIELDS);
        const now = new Date().toISOString();
        const status = payload.status || 'Pending';

        payload.activityLog = [{
            timestamp: now,
            user: 'System',
            action: 'created',
            details: 'Assignment created'
        }];
        payload.statusHistory = [{
            timestamp: now,
            from: 'Pending',
            to: status,
            note: 'Initial status'
        }];
        if (!payload.paymentHistory) payload.paymentHistory = [];

        const assignment = await Assignment.create(payload);
        res.json(assignment);
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/assignments/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Assignment.findByPk(id);
        if (!existing) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const payload = filterObject(req.body, ASSIGNMENT_FIELDS);
        const now = new Date().toISOString();

        const statusHistory = Array.isArray(existing.statusHistory) ? [...existing.statusHistory] : [];
        const paymentHistory = Array.isArray(existing.paymentHistory) ? [...existing.paymentHistory] : [];
        const activityLog = Array.isArray(existing.activityLog) ? [...existing.activityLog] : [];

        if (payload.status && payload.status !== existing.status) {
            statusHistory.push({
                timestamp: now,
                from: existing.status,
                to: payload.status,
                note: ''
            });
            activityLog.push({
                timestamp: now,
                user: 'System',
                action: 'status_changed',
                details: `${existing.status} → ${payload.status}`
            });
        }

        if (
            typeof payload.paidAmount === 'number' &&
            payload.paidAmount > (existing.paidAmount || 0)
        ) {
            paymentHistory.push({
                date: now,
                amount: payload.paidAmount - (existing.paidAmount || 0),
                type: 'incoming',
                method: 'Manual Entry',
                notes: 'Payment recorded'
            });
        }

        if (
            typeof payload.writerPaidAmount === 'number' &&
            payload.writerPaidAmount > (existing.writerPaidAmount || 0)
        ) {
            paymentHistory.push({
                date: now,
                amount: payload.writerPaidAmount - (existing.writerPaidAmount || 0),
                type: 'outgoing',
                method: 'Manual Entry',
                notes: 'Payment to writer'
            });
        }

        payload.statusHistory = statusHistory;
        payload.paymentHistory = paymentHistory;
        payload.activityLog = activityLog;

        await Assignment.update(payload, { where: { id }, individualHooks: true });
        const updatedAssignment = await Assignment.findByPk(id);
        res.json(updatedAssignment);
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/dashboard/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const assignments = await Assignment.findAll();
        const now = new Date();

        let totalPending = 0;
        let totalOverdue = 0;
        let pendingAmount = 0;
        let pendingWriterPay = 0;
        let activeDissertations = 0;

        for (const a of assignments) {
            const status = a.status;
            const isDone = status === 'Completed' || status === 'Cancelled';
            if (!isDone) totalPending += 1;
            if (new Date(a.deadline) < now && status !== 'Completed') totalOverdue += 1;
            pendingAmount += (a.price || 0) - (a.paidAmount || 0);
            pendingWriterPay += (a.writerPrice || 0) - (a.writerPaidAmount || 0);
            if (a.isDissertation && status !== 'Completed') activeDissertations += 1;
        }

        res.json({ totalPending, totalOverdue, pendingAmount, pendingWriterPay, activeDissertations });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/writers/:id/rate', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { quality, punctuality } = req.body;
        const writer = await Writer.findByPk(id);
        if (!writer) return res.status(404).json({ error: 'Writer not found' });

        const prior = (writer.rating && typeof writer.rating === 'object') ? writer.rating : {
            quality: 5.0, punctuality: 5.0, communication: 5.0, reliability: 5.0, count: 0
        };
        const newCount = (prior.count || 0) + 1;
        const rating = {
            quality: ((prior.quality || 5) * (prior.count || 0) + Number(quality)) / newCount,
            punctuality: ((prior.punctuality || 5) * (prior.count || 0) + Number(punctuality)) / newCount,
            communication: prior.communication || 5.0,
            reliability: prior.reliability || 5.0,
            count: newCount
        };

        await writer.update({ rating });
        res.json(writer);
    } catch (error) {
        console.error('Rate writer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/assignments/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Assignment.destroy({ where: { id: req.params.id }, individualHooks: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk operations for data management
app.post('/api/clear-all', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Clear in order to respect dependencies (if any, though SQLite might not always enforce)
        await Assignment.destroy({ where: {}, truncate: true });
        await Student.destroy({ where: {}, truncate: true });
        await Writer.destroy({ where: {}, truncate: true });
        await University.destroy({ where: {}, truncate: true });
        res.json({ success: true, message: 'All data cleared' });
    } catch (error) {
        console.error('Clear all error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/bulk-import', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { students, writers, assignments } = req.body;

        if (!students || !writers || !assignments) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // Import in order: students, writers, then assignments (due to foreign keys)
        const studentResults = await Student.bulkCreate(students, {
            updateOnDuplicate: ['name', 'email', 'phone', 'university', 'universityId', 'remarks', 'isFlagged', 'referredBy']
        });

        const writerResults = await Writer.bulkCreate(writers, {
            updateOnDuplicate: [
                'phone', 'name', 'email', 'specialty', 'isFlagged', 'rating',
                'availabilityStatus', 'maxConcurrentTasks', 'totalAssignments',
                'completedAssignments', 'onTimeDeliveries', 'level', 'points',
                'streak', 'lastActive'
            ]
        });

        const assignmentResults = await Assignment.bulkCreate(assignments, {
            updateOnDuplicate: [
                'studentId', 'writerId', 'title', 'type', 'subject', 'level', 'deadline',
                'status', 'priority', 'documentLink', 'wordCount', 'costPerWord', 'writerCostPerWord',
                'price', 'paidAmount', 'writerPrice', 'writerPaidAmount', 'sunkCosts',
                'isDissertation', 'totalChapters', 'chapters', 'description',
                'activityLog', 'paymentHistory', 'statusHistory', 'attachments'
            ]
        });

        res.json({
            success: true,
            imported: {
                students: studentResults.length,
                writers: writerResults.length,
                assignments: assignmentResults.length
            }
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Debug Endpoint — admin only; never expose schema mutation to anonymous callers
app.get('/api/debug-db', authenticateToken, isAdmin, async (req, res) => {
    try {
        await sequelize.authenticate();

        // Manual sync trigger (only in non-production)
        if (req.query.sync && process.env.NODE_ENV !== 'production') {
            console.log('Manual sync triggered via debug endpoint');
            await sequelize.sync({ alter: true });
        }

        let tables = [];
        try {
            tables = await sequelize.getQueryInterface().showAllTables();
        } catch (e) {
            tables = [`Error listing tables: ${e.message}`];
        }

        res.json({
            status: 'connected',
            dialect: sequelize.getDialect(),
            tables: tables,
            syncMessage: req.query.sync ? 'Sync attempted' : 'Use ?sync=true (non-production only) to force table creation'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});



// Initialize Database and Start Server
// Use alter: true to update schema (add completedAt) without dropping data
sequelize.sync().then(async () => {
    console.log('Database synced with schema updates');

    // Migration: Populate Universities from Students
    try {
        const students = await Student.findAll();
        const existingUnis = await University.findAll();
        const uniMap = new Map(existingUnis.map(u => [u.name.toLowerCase(), u]));

        for (const student of students) {
            if (student.university && !student.universityId) {
                const uniName = student.university.trim();
                const lowerName = uniName.toLowerCase();

                let uni = uniMap.get(lowerName);
                if (!uni) {
                    uni = await University.create({ name: uniName });
                    uniMap.set(lowerName, uni);
                    console.log(`Created university from migration: ${uniName}`);
                }

                student.universityId = uni.id;
                await student.save();
            }
        }
    } catch (err) {
        console.error('Migration failed:', err);
    }

    if (require.main === module) {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
}).catch(err => {
    console.error('Database sync failed:', err);
    // process.exit(1); // Don't exit on Vercel if DB sync fails (e.g. read-only FS)
});

module.exports = app;
