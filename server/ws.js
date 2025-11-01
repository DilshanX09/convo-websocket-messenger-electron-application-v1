const database = require('./connection');

const clients = new Map();

const sendUnreadMessageCount = (receiverId, senderId) => {
  database.query(
    "SELECT COUNT(*) as count FROM chat WHERE SENDER = ? AND RECEIVER = ? AND STATUS != 'read'",
    [senderId, receiverId],
    (err, results) => {
      if (err) return;
      const count = results[0].count;
      const receiverSocket = clients.get(receiverId);
      console.log('[sendUnreadMessageCount] receiverId=', receiverId, 'senderId=', senderId, 'count=', count);
      if (receiverSocket && receiverSocket.readyState === require('ws').OPEN) {
        try {
          receiverSocket.send(JSON.stringify({
            type: "unread_count_update",
            friendId: senderId,
            count
          }));
          console.log('[sendUnreadMessageCount] sent unread_count_update to', receiverId);
        } catch (e) {
          console.error('[sendUnreadMessageCount] failed to send', e);
        }
      } else {
        console.log('[sendUnreadMessageCount] receiver socket not connected for', receiverId);
      }
    }
  );
};

module.exports = { clients, sendUnreadMessageCount };
