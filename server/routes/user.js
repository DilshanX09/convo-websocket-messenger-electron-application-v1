const express = require('express');
const router = express.Router();
const database = require('../connection');

require('dotenv').config();

const path = require('path');
const fs = require('fs');

const upload = require('../util/multerMiddleware');

/*
     * Endpoint to get unread message counts for a user
     * URL - localhost:5000/api/v1/user/unread-messages/:id
     * Method - GET
     * Params - id (user ID)
     * Response - JSON array of objects with friendId and count of unread messages
*/
router.get('/unread-messages/:id', (req, res) => {

     const id = req.params.id;

     const sql = `
        SELECT SENDER as friendId, COUNT(*) as count
        FROM chat
        WHERE RECEIVER = ? AND STATUS != 'read'
        GROUP BY SENDER
    `;

     database.query(sql, [id], (err, results) => {
          if (err) res.json({ error: 'Database error' });
          res.status(200).json(results);
     });
});


/*
     * Endpoint to find user by username
     * URL - localhost:5000/api/v1/user/find-user
     * Method - POST
     * Body - JSON object with keyword (username)
     * Response - JSON array of user objects or error message
     * tested - yes
*/

/*
     {
          "UUID": "7765fd5a-e4e0-4d82-b3c9-1a00d012c975",
          "AUTH_2FA": 0,
          "USERNAME": "Chamod Dilshan",
          "EMAIL": "**************",
          "PASSWORD": "********",
          "PROFILE_IMAGE_URL": null,
          "JOINED_DATE": "2025-10-29T20:46:56.000Z",
          "BIO": null,
          "MOBILE": null,
          "VCODE": "*******",
          "UPDATE_AT": null,
          "LAST_LOGIN": null,
          "IS_ACTIVE": "true",
          "IS_VERIFIED": 2,
          "STATUS": null
     }
*/
router.post("/find-user", (req, res) => {

     const keyword = req.body.keyword;
     if (!keyword) return res.status(404).json({ error: "Keyword is required" });

     const query = "SELECT * FROM `users` WHERE `USERNAME` = ?";
     const params = [keyword];

     database.query(query, params, (error, results) => {
          if (error) return res.status(5000).json({ error: "Keyword is required" });
          res.status(200).json(results);
     });
});

/*
     * Endpoint to fetch user details
     * URL - localhost:5000/api/v1/friend/fetch-user-profile
     * Method - POST
     * Body - JSON object with user ID
     * Response - JSON object with username, email, profile image URL or error message
     * tested - yes
*/
router.post("/fetch-user-information", (req, res) => {

     const user = req.body.user;
     if (!user) return res.json({ error: "user is required" });

     const query = "SELECT USERNAME , EMAIL , PROFILE_IMAGE_URL FROM `users` WHERE `UUID` = ?";
     const params = [user];

     database.query(query, params, (error, results) => {
          if (error) return res.json({ error: "Database error" });
          if (results.length === 1) res.json({ username: results[0].USERNAME, email: results[0].EMAIL, profile_url: results[0].PROFILE_IMAGE_URL });
     });
});

/*
     * Endpoint to get user profile details
     * URL - localhost:5000/api/v1/user/profile
     * Method - POST
     * Body - JSON object with friend (user ID)
     * Response - JSON array of user profile details
*/
router.get("/profile/:id", (req, res) => {

     const user = req.params.id;

     const query = "SELECT  USERNAME , PROFILE_IMAGE_URL , EMAIL , BIO , MOBILE , LAST_LOGIN , JOINED_DATE , STATUS , UUID FROM  `users` WHERE `UUID` = ?";
     const params = [user];

     database.query(query, params, (error, results) => {
          if (error) return res.status(500).json({ error: "Database error" });
          res.status(200).json(results);
     });
});

/*
     * Endpoint to update user profile
     * URL - localhost:5000/api/v1/user/update-profile
     * Method - PUT
     * Body - multipart/form-data with image file, bio, user ID, mobile number
     * Response - JSON object with response status, image URL or error message
*/
router.put('/update-profile', upload.single('image'), (req, res) => {

     const { bio, user, mobile } = req.body;

     const query = "SELECT PROFILE_IMAGE_URL FROM users WHERE UUID = ?";
     const params = [user];

     if (req.file) {
          database.query(query, params, (error, results) => {

               if (error) return false;
               const currentImage = results[0]?.PROFILE_IMAGE_URL;

               if (currentImage) {
                    const filename = path.basename(currentImage);
                    const imagePath = path.join(__dirname, './uploads', filename);
                    fs.unlink(imagePath, (error) => {
                         if (error)
                              if (error.code === 'ENOENT') console.log('File not found, skipping delete');
                              else console.error('Error deleting image:', error);
                         else console.log('Image deleted:', imagePath);
                    });
               }
          });
     }

     const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

     let sql;
     let values;

     const selectedQuery = "SELECT PROFILE_IMAGE_URL FROM users WHERE UUID = ?";

     if (imagePath) {

          database.query(selectedQuery, params, (error, results) => {
               if (error) return res.status(500).json({ error: 'Database error' });
               const oldImagePath = results[0]?.PROFILE_IMAGE_URL;

               if (oldImagePath) {
                    const oldImageFullPath = path.join(__dirname, oldImagePath);
                    fs.unlink(oldImageFullPath, (error) => {
                         if (error) console.log('Error removing old image:', error);
                    });
               }
          });
     }

     if (imagePath && bio !== null && mobile !== null) {
          sql = 'UPDATE `users` SET BIO = ?, PROFILE_IMAGE_URL = ?, MOBILE = ? WHERE `UUID` = ?';
          values = [bio, imagePath, mobile, user];
     } else if (imagePath && bio !== null) {
          sql = 'UPDATE `users` SET BIO = ?, PROFILE_IMAGE_URL = ? WHERE `UUID` = ?';
          values = [bio, imagePath, user];
     } else if (imagePath && mobile !== null) {
          sql = 'UPDATE `users` SET PROFILE_IMAGE_URL = ?, MOBILE = ? WHERE `UUID` = ?';
          values = [imagePath, mobile, user];
     } else if (bio !== null && mobile !== null) {
          sql = 'UPDATE `users` SET BIO = ?, MOBILE = ? WHERE `UUID` = ?';
          values = [bio, mobile, user];
     } else if (imagePath) {
          sql = 'UPDATE `users` SET PROFILE_IMAGE_URL = ? WHERE `UUID` = ?';
          values = [imagePath, user];
     } else if (bio !== null) {
          sql = 'UPDATE `users` SET BIO = ? WHERE `UUID` = ?';
          values = [bio, user];
     } else if (mobile !== null) {
          sql = 'UPDATE `users` SET MOBILE = ? WHERE `UUID` = ?';
          values = [mobile, user];
     } else {
          return res.status(400).json({ error: 'No data to update' });
     }

     database.query(sql, values, (error) => {

          if (error) {

               res.status(500).json({ error: 'Database error' });
          } else {

               res.status(200).json({
                    status: 200,
                    image: imagePath,
                    message: 'Profile updated successfully!',
               });
          }
     });

});

/*
     * Endpoint to get active sessions for a user
     * URL - localhost:5000/api/v1/user/sessions
     * Method - POST
     * Body - JSON object with userId
     * Response - JSON object with array of active sessions or error message
*/
router.post('/sessions', (req, res) => {
     const userId = req.body.userId;
     if (!userId) return res.status(400).json({ error: 'User ID is required' });

     const query = "SELECT BROWSER_NAME , BROWSER_VERSION , PLATFORM , IP_ADDRESS , STATUS , DATE , LOCATION FROM device_information WHERE UUID = ?";
     const params = [userId];

     database.query(query, params, (error, results) => {
          if (error) return res.status(500).json({ error: 'Database error' });
          res.json({ sessions: results });
     });
});

module.exports = router;