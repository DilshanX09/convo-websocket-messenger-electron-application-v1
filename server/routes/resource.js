const express = require('express');
const database = require('../connection');
const router = express.Router();

/*
     * Endpoint to fetch media messages (images) between two users
     * URL - localhost:5000/api/v1/resources/resource
     * Method - POST
     * Body - JSON object with sender (user ID) and receiver (friend ID)
     * Response - JSON array of media messages
*/
router.post("/resource", (req, res) => {
     const { sender, receiver } = req.body;
     if (!sender || !receiver) return res.status(404).json({ error: "Sender or Receiver ID can't find....!" });

     const query = "SELECT IMAGE_URL , MESSAGE FROM `chat` WHERE ((`SENDER` = ? AND `RECEIVER` = ?) OR (`SENDER` = ? AND `RECEIVER` = ?)) AND IMAGE_URL IS NOT NULL";
     const params = [sender, receiver, receiver, sender];

     database.query(query, params, (error, results) => {
          if (error) return res.status(500).json({ error: "Database error" });
          else return res.status(200).json(results);
     });

});

module.exports = router;