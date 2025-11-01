const express = require('express');

const fs = require('fs');
const path = require('path');
const database = require('../connection');
const upload = require('../util/multerMiddleware');

const currentDate = require('../date-format/currentDate');
const { sendUnreadMessageCount, clients } = require('../ws');




/* 
     * chat Routes
     * Base URL - /api/v1/message -> [ /chats, /store-message ]
*/
const router = express.Router();

/*
     * Endpoint to mark messages as read between two users
     * URL - /api/v1/message/mark-read
     * Method - POST
     * Body - { readerId, senderId }
     * Response - { status: 'success' }
     * Notes: updates DB and notifies the sender via WebSocket for each chat id marked read
*/
router.post('/mark-read', (req, res) => {
     const { readerId, senderId } = req.body;
     if (!readerId || !senderId) return res.status(400).json({ error: 'readerId and senderId required' });

     console.log(`[mark-read] reader=${readerId} sender=${senderId}`);

     const updateQuery = "UPDATE chat SET STATUS = 'read' WHERE SENDER = ? AND RECEIVER = ? AND STATUS != 'read'";
     database.query(updateQuery, [senderId, readerId], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });

          // select chat ids to notify sender
          const selectQuery = "SELECT CHAT_ID FROM chat WHERE SENDER = ? AND RECEIVER = ? AND STATUS = 'read'";
          database.query(selectQuery, [senderId, readerId], (err, results) => {
               if (err) return res.status(500).json({ error: 'Database error' });

               const senderSocket = clients.get(senderId);
               if (senderSocket && senderSocket.readyState === require('ws').OPEN) {
                    results.forEach(row => {
                         try {
                              const payload = { type: 'read', CHAT_ID: row.CHAT_ID, from: readerId, to: senderId };
                              senderSocket.send(JSON.stringify(payload));
                              console.log('[mark-read] notified sender socket', senderId, 'CHAT_ID', row.CHAT_ID);
                         } catch (e) {
                              console.error('[mark-read] failed notify', e);
                         }
                    });
               } else {
                    console.log('[mark-read] sender socket not connected for', senderId);
               }

               return res.status(200).json({ status: 'success' });
          });
     });
});

/* mark-read route moved below where `router` is initialized */

/*
     * Endpoint to get chat messages between two users
     * URL - localhost:5000/api/v1/message/chats
     * Method - POST
     * Body - JSON object with user (sender ID) and friend (receiver ID)
     * Response - JSON array of chat messages
*/
router.post("/chats", (req, res) => {

     const sender = req.body.user;
     const receiver = req.body.friend;

     if (!sender || !receiver) res.json({ error: "Sender or Receiver is required " });

     const query = "SELECT * FROM `chat` WHERE ( SENDER = ? AND RECEIVER = ? ) OR ( SENDER = ? AND RECEIVER = ?)  ORDER BY DATE ASC";
     const params = [sender, receiver, receiver, sender];

     database.query(query, params, (error, results) => {
          if (error) res.status(500).json({ error: "Database error" });
          res.status(200).json(results);
     });
});

/*
     * Endpoint to store a chat message
     * URL - localhost:5000/api/v1/message/store-message
     * Method - POST
     * Body - FormData with senderId, receiverId, messageText, optional file (image, video, audio), replayTo, status
     * Response - JSON object with stored message details
     * Handles file uploads and associates them with the message
*/
router.post('/store-message', upload.single('file'), async (req, res) => {

     const { senderId, receiverId, messageText, replayTo, status } = req.body;

     const file = req.file;
     const date = currentDate();

     let imageUrl = null;
     let videoUrl = null;
     let voiceUrl = null;
     let replayMessage = null;
     let replayImageUrl = null;

     const getReplayData = () => {
          return new Promise((resolve) => {

               if (!replayTo) return resolve();

               const query = "SELECT MESSAGE, IMAGE_URL FROM chat WHERE CHAT_ID = ?";
               const params = [replayTo];

               database.query(query, params, (error, results) => {

                    if (error) return resolve();

                    if (results.length > 0) {
                         replayMessage = results[0].MESSAGE || null;
                         replayImageUrl = results[0].IMAGE_URL || null;
                    }
                    resolve();
               });
          });
     };

     const processFile = () => {

          return new Promise((resolve, reject) => {

               if (!file) return resolve();

               const filename = file.originalname.replace(/\s+/g, '_');
               const uploadPath = path.join(__dirname, '..', 'uploads', filename);

               fs.rename(file.path, uploadPath, (error) => {
                    if (error) return reject(new Error("File handling failed"));
                    const fileUrl = `/uploads/${filename}`;

                    if (file.mimetype.startsWith('image/')) {
                         imageUrl = fileUrl;
                    } else if (file.mimetype.startsWith('video/')) {
                         videoUrl = fileUrl;
                    } else if (file.mimetype.startsWith('audio/')) {
                         voiceUrl = fileUrl;
                    }
                    resolve();
               });
          });
     };

     const insertMessage = () => {
          return new Promise((resolve, reject) => {
               if (!messageText && !imageUrl && !videoUrl && !voiceUrl && !status) {
                    return reject(new Error('Empty message and no file provided'));
               }

               const insertQuery = "INSERT INTO chat (MESSAGE, IMAGE_URL, VIDEO_URL, VOICE_URL, SENDER, RECEIVER, DATE, REPLAY_TO, REPLAY_MESSAGE, REPLAY_IMAGE_URL , STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)";
               const insertParams = [messageText || null, imageUrl, videoUrl, voiceUrl, senderId, receiverId, date, replayTo || null, replayMessage, replayImageUrl, status];

               database.query(insertQuery, insertParams, (error, results) => {
                    if (error) return reject(error);
                    return resolve(results);
               });
          });
     };

     try {
          await getReplayData();
          await processFile();
          const results = await insertMessage();

          try {
               sendUnreadMessageCount(receiverId, senderId);
          } catch (e) {
               console.error('sendUnreadMessageCount error:', e);
          }

          return res.status(200).json({ message: messageText, imageUrl, videoUrl, voiceUrl, chatId: results.insertId, replayMessage, replayImageUrl, replayTo });
     } catch (Exception) {
          if (Exception && Exception.message === 'Empty message and no file provided') {
               return res.status(400).json({ error: Exception.message });
          }
          console.error('Store message error:', Exception);
          return res.status(500).json({ error: Exception.message || 'Failed to store message' });
     }

});

module.exports = router;