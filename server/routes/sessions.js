const express = require('express');
const currentDate = require('../date-format/currentDate');
const database = require('../connection');
const router = express.Router();

/*
     * Endpoint to store or update device information for a user
     * URL - localhost:5000/api/v1/sessions/store-device-information
     * Method - POST
     * Body - JSON object with userId and data (device details)
     * Response - JSON object with response status or error message
*/
router.post('/store-device-information', (req, res) => {

     const { userId, data } = req.body;
     const date = currentDate();

     if (!userId || !data) return res.status(400).json({ error: 'User ID and data are required' });
     const checkQuery = `SELECT UUID FROM device_information 
  WHERE UUID = ? AND BROWSER_NAME = ? AND BROWSER_VERSION = ? AND PLATFORM = ? AND IP_ADDRESS = ?`;
     const checkParams = [userId, data.browserName, data.browserVersion, data.platform, data.ipAddress];

     database.query(checkQuery, checkParams, (err, results) => {

          if (err) return res.status(500).json({ error: 'Database error' });

          if (results.length === 0) {

               const insertQuery = `
        INSERT INTO device_information (UUID, BROWSER_NAME, BROWSER_VERSION, PLATFORM, IP_ADDRESS, STATUS, DATE, AGENT, LOCATION, LANGUAGE)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
               const insertParams = [
                    userId, data.browserName, data.browserVersion, data.platform, data.ipAddress,
                    data.online ? 'Online' : 'Offline', date, data.userAgent, data.location, data.language
               ];

               database.query(insertQuery, insertParams, (insertErr) => {
                    if (insertErr) {
                         console.error('Error inserting device information:', insertErr);
                    }
               });

          } else {

               const updateQuery = `
        UPDATE device_information
        SET STATUS = ?, DATE = ?, AGENT = ?, LOCATION = ?, LANGUAGE = ?
        WHERE UUID = ? AND BROWSER_NAME = ? AND BROWSER_VERSION = ? AND PLATFORM = ? AND IP_ADDRESS = ?
      `;
               const updateParams = [
                    userId ? 'Online' : 'Offline', date, data.userAgent, data.location, data.language,
                    data.userId, data.browserName, data.browserVersion, data.platform, data.ipAddress
               ];

               database.query(updateQuery, updateParams, (updateErr) => {
                    if (updateErr) {
                         console.error('Error updating device information:', updateErr);
                    }
               });
          }
     });
});

module.exports = router;