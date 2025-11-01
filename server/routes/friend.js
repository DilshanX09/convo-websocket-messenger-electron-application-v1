const express = require('express');
const database = require('../connection');
const currentDate = require('../date-format/currentDate');
const router = express.Router();

/*
     * Endpoint to add a friend for a user
     * URL - localhost:5000/api/v1/friend/add-friend
     * Method - POST
     * Body - JSON object with cookieUser (user ID) and friend_uuid (friend's user ID)
     * Response - JSON object with response status or error message
     * tested - yes
*/
router.post("/add-friend", (req, res) => {

  const { loggedInUserId, friend_uuid } = req.body;
  const add_date = currentDate();

  if (loggedInUserId === friend_uuid) return;

  const selectQuery = "SELECT * FROM `friend` WHERE `USER_ID` = ? AND `FRIEND_ID` = ?";
  const selectParams = [loggedInUserId, friend_uuid];

  const insertQuery = "INSERT INTO `friend` (`USER_ID`,`FRIEND_ID`,`ADDED_DATE`) VALUES (? , ? , ?)";
  const insertParams = [loggedInUserId, friend_uuid, add_date];

  database.query(selectQuery, selectParams, (error, results) => {

    if (error) return res.status(500).json({ error: "Database error" });
    if (results.length === 1) return res.json({ error: "this user already added!!", });

    database.query(insertQuery, insertParams, (error) => {
      if (error) return res.status(500).json({ error: "Database error" });
      res.json({ status: "success", response: "user added success", });
    });
  });

});

/*
     * Endpoint to fetch favorite friends of a user along with their latest chat message
     * URL - localhost:5000/api/v1/friend/fetch-favorite-friends/:id
     * Method - GET
     * Response - JSON array of favorite friends with their latest chat message
*/
router.get('/fetch-favorite-friends/:id', (req, res) => {

  const user = req.params.id;

  if (!user) return res.status(400).json({ error: 'User ID is required' });

  const sql = `
     SELECT
  u.USERNAME,
  u.PROFILE_IMAGE_URL,
  u.UUID,
  u.STATUS,
  c.MESSAGE,
  c.DATE,
  c.IMAGE_URL,
  c.VIDEO_URL,
  c.VOICE_URL
FROM favorite f
INNER JOIN users u ON f.FRIEND_ID = u.UUID
LEFT JOIN (
  SELECT ch.*
  FROM chat ch
  INNER JOIN (
    SELECT
      CASE
        WHEN SENDER < RECEIVER THEN CONCAT(SENDER, '_', RECEIVER)
        ELSE CONCAT(RECEIVER, '_', SENDER)
      END AS chat_key,
      MAX(DATE) AS latest_date
    FROM chat
    GROUP BY chat_key
  ) lc ON (
    (CASE
      WHEN ch.SENDER < ch.RECEIVER THEN CONCAT(ch.SENDER, '_', ch.RECEIVER)
      ELSE CONCAT(ch.RECEIVER, '_', ch.SENDER)
    END) = lc.chat_key AND ch.DATE = lc.latest_date
  )
) c ON (
  (c.SENDER = f.USER_ID AND c.RECEIVER = f.FRIEND_ID) OR
  (c.SENDER = f.FRIEND_ID AND c.RECEIVER = f.USER_ID)
)
WHERE f.USER_ID = ?
ORDER BY c.DATE IS NULL, c.DATE DESC
  `;

  const params = [user, user, user, user, user, user, user];
  database.query(sql, params, (error, results) => {
    if (error) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(results);
  });
});

/*
     * Endpoint to fetch all friends of a user along with their latest chat message
     * URL - localhost:5000/api/v1/friend/fetch-friend/:id
     * Method - GET
     * Response - JSON array of friends with their latest chat message
*/
router.get("/fetch-friend/:id", (req, res) => {

  const userId = req.params.id;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const sql = `
  SELECT 
  u.USERNAME,
  u.PROFILE_IMAGE_URL,
  u.UUID,
  u.STATUS,
  u.LAST_LOGIN,
  c.MESSAGE,
  c.DATE,
  c.IMAGE_URL,
  c.VIDEO_URL,
  c.VOICE_URL
FROM friend f
INNER JOIN users u ON f.FRIEND_ID = u.UUID
LEFT JOIN (
  SELECT c1.*
  FROM chat c1
  INNER JOIN (
    SELECT 
      CASE 
        WHEN SENDER < RECEIVER THEN CONCAT(SENDER, '_', RECEIVER)
        ELSE CONCAT(RECEIVER, '_', SENDER)
      END AS chat_key,
      MAX(DATE) AS latest_date
    FROM chat
    WHERE SENDER = ? OR RECEIVER = ?
    GROUP BY chat_key
  ) c2 ON 
    (
      (c1.SENDER < c1.RECEIVER AND CONCAT(c1.SENDER, '_', c1.RECEIVER) = c2.chat_key) OR
      (c1.SENDER > c1.RECEIVER AND CONCAT(c1.RECEIVER, '_', c1.SENDER) = c2.chat_key)
    )
    AND c1.DATE = c2.latest_date
) c ON 
  (
    (c.SENDER = f.FRIEND_ID AND c.RECEIVER = ?) OR 
    (c.SENDER = ? AND c.RECEIVER = f.FRIEND_ID)
  )
WHERE f.USER_ID = ?
ORDER BY c.DATE DESC
  `;

  const params = [userId, userId, userId, userId, userId, userId, userId];
  database.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(200).json(results);
  });
});

/*
  * Endpoint to fetch a friend's profile details
  * URL - localhost:5000/api/v1/friend/fetch-friend-profile
  * Method - POST
  * Body - JSON object with friend (friend's user ID)
  * Response - JSON array of friend's profile details
*/
router.post('/fetch-friend-profile', (req, res) => {
  const friend = req.body.friend;
  if (!friend) return res.status(404).json({ error: "friend is required" });
  const query = "SELECT  USERNAME , PROFILE_IMAGE_URL , EMAIL , BIO , MOBILE , LAST_LOGIN , JOINED_DATE , STATUS , UUID FROM  `users` WHERE `UUID` = ?";
  const params = [friend];
  database.query(query, params, (error, results) => {
    if (error) return res.status(500).json({ error: "Database error" });
    res.status(200).json(results);
  });
});

/*
     * Endpoint to add a friend to user's favorite list
     * URL - localhost:5000/api/v1/friend/add-to-favorite
     * Method - POST
     * Body - JSON object with user (user ID) and friend (friend's user ID)
     * Response - JSON object with response status or error message
*/
router.post('/add-to-favorite', (req, res) => {

  const { user, friend } = req.body;
  if (!user || !friend) return res.status(400).json({ err: 'User and friend IDs are required' });

  const query = "SELECT * FROM favorite WHERE `FRIEND_ID` = ? AND `USER_ID` = ?";
  const params = [friend, user];

  database.query(query, params, (error, result) => {

    if (error) return res.status(500).json({ error: 'Database error' });
    if (result.length === 0) {
      const date = currentDate();
      const insertQuery = "INSERT INTO `favorite` (`ADDED_DATE`,`FRIEND_ID`,`USER_ID`) VALUES (? , ? , ?)";
      const insertParams = [date, friend, user];
      database.query(insertQuery, insertParams, (error) => {
        if (error) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ status: 200, message: 'Friend added to favorites successfully!' });
      });

    } else {
      res.json({ err: 'friend already added!' })
    }
  });
});

module.exports = router;