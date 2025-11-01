const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const authRoutes = require('./auth');
const friendRoutes = require('./friend');
const chatRoutes = require('./chat');
const sessionsRoutes = require('./sessions');
const resourcesRoutes = require('./resource');

router.use('/resources', resourcesRoutes);
router.use('/user', userRoutes);
router.use('/auth', authRoutes);
router.use('/friend', friendRoutes);
router.use('/message', chatRoutes);
router.use('/sessions', sessionsRoutes);

router.get('/health', (req, res) => {
     res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;