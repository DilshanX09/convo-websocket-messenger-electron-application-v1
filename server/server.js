const express = require("express");
const cors = require("cors");
const cookie = require("cookie-parser");
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const currentDate = require("./date-format/currentDate");
const database = require("./connection");
require("dotenv").config();

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT;
const websocket = new WebSocket.Server({ port: process.env.WS_PORT });

/*
  * Express Middleware
  * serves static files from the 'uploads' directory
  * parses JSON request bodies
  * handles cookies
  * enables CORS for requests from the React front-end
  * used for general request handling in the application
  * CORS settings allow credentials and specify the front-end origin
*/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());
app.use(cors({ origin: process.env.ORIGIN, credentials: true, }));
app.use('/api/v1', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const { clients } = require('./ws');

/*
  * WebSocket Server
  * handles real-time communication for chat messages, user status updates, typing indicators, and message deletions
  * manages connected clients and broadcasts relevant events to appropriate users
  * listens for various message types and performs corresponding actions
  * used for real-time chat functionality in the application
  * events: connection, message, close
  * message types: set_user_id, message, logged_status, typing, stopTyping, delete_message, updateFriendList, delivered, read
  * manages user online/offline status and notifies friends of status changes
  * updates message status (sent, delivered, read) in the database and notifies senders
  * handles file deletions when messages are deleted
  * maintains a map of connected clients for efficient message routing
  * ensures data integrity and consistency in message status updates
  * integrates with the MySQL database for persistent storage of chat data and user information
  * error handling for JSON parsing and database operations
  * scalable to support multiple concurrent users and real-time interactions
  * secure communication through WebSocket protocol
  * optimized for low latency and high throughput in message delivery
  * designed for easy integration with front-end applications
*/
websocket.on('connection', (socket) => {

  socket.userId = null;

  socket.on('close', () => {

    if (socket.userId) {

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.userId !== socket.userId) {
          client.send(JSON.stringify({
            type: 'status',
            userId: socket.userId,
            status: 'Offline',
            LAST_LOGIN: new Date(),
          }));
        }
      });

      clients.delete(socket.userId);
      updateUserStatus(socket.userId, 'Offline');
    }

  });

  socket.on('message', async (data) => {


    try {

      const message = JSON.parse(data);

      switch (message.type) {
        case 'set_user_id':
          if (message.userId) {
            socket.userId = message.userId;
            clients.set(message.userId, socket);

            clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && client.userId !== message.userId) {
                client.send(JSON.stringify({
                  type: 'status',
                  userId: message.userId,
                  status: 'Online',
                }));
              }
            });

            updateUserStatus(message.userId, 'Online');
          }

          break;

        case 'message':
          if (message.RECEIVER) {
            const receiverSocket = clients.get(message.RECEIVER);
            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
              receiverSocket.send(JSON.stringify(message));
            }
          }

          break;

        case 'logged_status':
          if (message.userId) {
            updateUserStatus(message.userId, 'Offline');
          }

          break;

        case 'typing':
        case 'stopTyping':
          if (message.to) {
            const receiverSocket = clients.get(message.to);
            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
              receiverSocket.send(JSON.stringify(message));
            }
          }

          break;

        case 'delete_message':

          [message.user, message.selected_user].forEach(userId => {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "delete_message",
                chat_id: message.chat_id
              }));
            }
          });

          deleteChat(message.chat_id, message.user, message.selected_user);

          break;

        case 'updateFriendList':
          if (message.from && message.to) {
            const receiver = clients.get(message.to);
            if (receiver && receiver.readyState === WebSocket.OFPEN) {
              receiver.send(JSON.stringify(message));
            }
          }

        case 'delivered':
          if (message.from && message.to && message.CHAT_ID) {
            database.query("UPDATE chat SET STATUS = ? WHERE CHAT_ID = ?", ['delivered', message.CHAT_ID], (err) => {
              if (err) return;

              const senderSocket = clients.get(message.to);
              if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
                senderSocket.send(JSON.stringify({
                  type: 'delivered',
                  CHAT_ID: message.CHAT_ID,
                  from: message.from,
                  to: message.to,
                }));
              }
            });
          }

          break;

        case 'read':

          if (message.from && message.to) {
            console.log('[WS read] from', message.from, 'to', message.to, 'CHAT_ID', message.CHAT_ID);

            const updateQuery = "UPDATE chat SET STATUS = 'read' WHERE SENDER = ? AND RECEIVER = ? AND STATUS != 'read'";
            database.query(updateQuery, [message.to, message.from], (err) => {
              if (err) return;

              const selectQuery = "SELECT CHAT_ID FROM chat WHERE SENDER = ? AND RECEIVER = ? AND STATUS = 'read'";
              database.query(selectQuery, [message.to, message.from], (err, results) => {
                if (err) return;

                const senderSocket = clients.get(message.to);

                if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {

                  const payload = {
                    type: 'read',
                    CHAT_ID: message.CHAT_ID,
                    from: message.from,
                    to: message.to
                  };
                  senderSocket.send(JSON.stringify(payload));
                  console.log('[WS read] notified sender', message.to, 'CHAT_ID', message.CHAT_ID);
                }

              });
            });
          }

          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }


    const query = "SELECT CHAT_ID, SENDER FROM chat WHERE RECEIVER = ? AND STATUS = 'sent'";
    database.query(query, [socket.userId], (err, results) => {
      if (err) return;
      results.forEach(row => {
        database.query("UPDATE chat SET STATUS = 'delivered' WHERE CHAT_ID = ?", [row.CHAT_ID]);
        const senderSocket = clients.get(row.SENDER);
        if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
          senderSocket.send(JSON.stringify({
            type: 'delivered',
            CHAT_ID: row.CHAT_ID,
            from: socket.userId,
            to: row.SENDER
          }));
        }
      });
    });

  });
});


const deleteChat = (chat_id, sender, receiver) => {

  const imageSelectQuery = `SELECT IMAGE_URL FROM chat WHERE CHAT_ID = ?`;
  const imageSelectParams = [chat_id];

  const chatDeleteQuery = `DELETE FROM chat WHERE CHAT_ID = ? AND SENDER = ? AND RECEIVER = ?`;
  const chatDeleteParams = [chat_id, sender, receiver];

  const updateQuery = `UPDATE chat SET REPLAY_TO = NULL, REPLAY_MESSAGE = "Original message deleted" WHERE REPLAY_TO = ?`;
  const updateParams = [chat_id];

  database.query(imageSelectQuery, imageSelectParams, (error, results) => {

    if (error) return console.error("Database error");

    if (results.length === 0) return;

    const imageUrl = results[0]?.IMAGE_URL;

    if (imageUrl) {

      const filename = path.basename(imageUrl);
      const imagePath = path.join(__dirname, 'uploads', filename);

      fs.unlink(imagePath, (error) => {
        if (error && error.code !== 'ENOENT') {
          console.error('Error deleting image:', error);
        }
      });

    }
  });

  database.query(chatDeleteQuery, chatDeleteParams, (error) => {

    if (error) return console.error('DB DELETE error:', error);

    database.query(updateQuery, updateParams, (error) => {
      if (error) console.error('DB UPDATE reply messages error:', error);
    });
  }

  );

};

const updateUserStatus = (userId, status) => {

  let last = currentDate();

  const query = "UPDATE `users` SET `STATUS` = ? ,`LAST_LOGIN` = ? WHERE `UUID` = ?";
  const params = [status, last, userId];

  database.query(query, params, (error) => {
    if (error) return false;
  });

  return true;

};

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

