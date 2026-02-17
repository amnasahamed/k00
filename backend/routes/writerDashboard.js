const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Writer, Assignment, WriterAchievement } = require('../models');

// Get writer earnings leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { sequelize } = require('../models');

    // Aggregation: Sum of writerPrice for completed assignments per writer
    const leaderboard = await Assignment.findAll({
      attributes: [
        'writerId',
        [sequelize.fn('sum', sequelize.col('writerPrice')), 'totalEarnings']
      ],
      include: [
        {
          model: Writer,
          attributes: ['name']
        }
      ],
      where: {
        status: { [Op.or]: ['Completed', 'completed'] },
        writerId: { [Op.ne]: null }
      },
      group: ['writerId'],
      order: [[sequelize.literal('totalEarnings'), 'DESC']],
      limit: 10
    });

    // Format for frontend
    const formatedLeaderboard = leaderboard.map(entry => ({
      name: entry.Writer ? entry.Writer.name : 'Unknown Writer',
      totalEarnings: Math.round(entry.get('totalEarnings') || 0)
    }));

    res.json(formatedLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get writer dashboard data
router.get('/dashboard/:writerId', async (req, res) => {
  try {
    const { writerId } = req.params;

    // Authorization check: Writers can only see their own dashboard
    if (req.user.role === 'writer' && req.user.id.toString() !== writerId.toString()) {
      return res.status(403).json({ error: 'Access denied: You can only view your own dashboard' });
    }

    // Get writer details
    const writer = await Writer.findByPk(writerId);
    if (!writer) {
      return res.status(404).json({ error: 'Writer not found' });
    }

    // Get writer's assignments (without student personal info or sensitive pricing)
    const assignments = await Assignment.findAll({
      where: { writerId },
      // Include completedAt and updatedAt for accurate timeline calculation
      attributes: ['id', 'title', 'subject', 'writerPrice', 'writerPaidAmount', 'status', 'deadline', 'createdAt', 'updatedAt', 'completedAt'],
      order: [['createdAt', 'DESC']]
    });

    // Get writer achievements
    const achievements = await WriterAchievement.findAll({
      where: { writerId },
      order: [['awardedAt', 'DESC']],
      limit: 10
    });

    // Calculate performance metrics FROM ACTUAL ASSIGNMENTS (dynamic consistent calc)
    const totalAssignments = assignments.length;

    // Filter completed assignments
    const completedAssignmentsList = assignments.filter(a =>
      a.status === 'Completed' || a.status === 'completed'
    );
    const completedAssignments = completedAssignmentsList.length;

    // Completion Rate
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    // Calculate total earnings from writerPrice of completed assignments
    const totalEarnings = completedAssignmentsList
      .reduce((sum, a) => sum + (a.writerPrice || 0), 0);

    // Calculate amount already paid to writer (all assignments, including partials on active ones)
    const totalPaid = assignments.reduce((sum, a) => sum + (a.writerPaidAmount || 0), 0);

    // Precise On-Time Rate Calculation
    let onTimeCount = 0;
    completedAssignmentsList.forEach(a => {
      // Use completedAt if available (new data), otherwise fallback to updatedAt (legacy)
      const finishTime = a.completedAt || a.updatedAt;
      if (new Date(finishTime) <= new Date(a.deadline)) {
        onTimeCount++;
      }
    });
    // On-Time Rate based on COMPLETED assignments
    const onTimeRate = completedAssignments > 0 ? Math.round((onTimeCount / completedAssignments) * 100) : 0;

    // Calculate average rating from rating object (defensive handling)
    let avgRating = 0;
    if (writer.rating) {
      if (typeof writer.rating === 'object') {
        avgRating = writer.rating.quality || 0;
      } else {
        avgRating = Number(writer.rating) || 0;
      }
    }

    // Get available assignments (excluding those already assigned)
    const availableAssignments = await Assignment.findAll({
      where: {
        writerId: null,
        status: { [Op.or]: ['Pending', 'pending'] }
      },
      attributes: ['id', 'title', 'subject', 'writerPrice', 'deadline', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Count active (non-completed) assignments
    const activeCount = assignments.filter(a =>
      !['Completed', 'completed', 'Cancelled', 'cancelled'].includes(a.status)
    ).length;

    res.json({
      writer: {
        id: writer.id,
        name: writer.name,
        phone: writer.phone,
        level: writer.level,
        points: writer.points || totalEarnings, // Fallback to earnings if points unused
        rating: avgRating,
        streak: writer.streak
      },
      performance: {
        completionRate,
        averageRating: avgRating,
        onTimeRate,
        totalEarnings,
        totalPaid,
        pendingPayment: totalEarnings - totalPaid
      },
      assignments,
      achievements,
      availableAssignments,
      stats: {
        total: totalAssignments,
        active: activeCount,
        completed: completedAssignments
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
