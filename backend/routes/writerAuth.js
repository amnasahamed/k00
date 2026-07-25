const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Writer } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Simple mobile number login (no OTP or password)
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number format
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    // Find writer
    let writer = await Writer.findOne({ where: { phone } });

    if (!writer) {
      return res.status(401).json({ error: 'Unauthorized: Mobile number not registered. Please contact the administrator.' });
    }

    // Update last active timestamp
    await writer.update({ lastActive: new Date() });

    // Generate JWT
    const token = jwt.sign(
      { id: writer.id, phone: writer.phone, role: 'writer' },
      JWT_SECRET,
      { expiresIn: '30d' } // Longer session for writers
    );

    res.json({
      token,
      writer: {
        id: writer.id,
        phone: writer.phone,
        name: writer.name,
        level: writer.level,
        points: writer.points
      }
    });
  } catch (error) {
    console.error('Writer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
