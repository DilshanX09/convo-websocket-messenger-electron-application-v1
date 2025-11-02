const express = require('express');
const Validator = require('../validation/AuthDataValidate');
const database = require('../connection');
const createUniqueOTP = require('../util/uniqueOtpGenerator');
const get2FATemplate = require('../templates/get2FATemplate');
const getEmailVerifyTemplate = require('../templates/getVerifyEmailTemplate');
const transporter = require('../util/transporter');
const router = express.Router();
require('dotenv').config();
const { v4: UUIDv4 } = require("UUID");
const currentDate = require("../date-format/currentDate");

const send2FACode = (id, email) => {
     const otp = createUniqueOTP();
     const query = "UPDATE `users` SET `VCODE` = ? WHERE `UUID` = ?";
     const params = [otp, id];
     database.query(query, params, (error) => {
          if (error) return "Database error";
          let mailOptions = {
               from: process.env.EMAIL,
               to: email,
               subject: "Convo Chat Two Factor Authentication",
               html: get2FATemplate(otp, email),
          };
          transporter.sendMail(mailOptions, (error) => {
               if (error) console.log("Email sending failed  please try again later");
          });
     });
}

/* 
     * Endpoint to handle user login
     * URL - localhost:5000/api/v1/auth/login
     * Method - POST
     * Body - JSON object with email and password
     * Response - JSON object with response status, UUID, email or error message
     * tested - yes
*/
router.post("/login", (req, res) => {

     const { email, password } = req.body;

     if (Validator.isEmailValid(email)) return res.json(Validator.isEmailValid(email));
     else if (Validator.isPasswordValid(password)) return res.json(Validator.isPasswordValid(password));

     const query = "SELECT * FROM `users` WHERE `EMAIL` = ? AND `PASSWORD` = ?";
     const params = [email, password];

     database.query(query, params, (error, results) => {

          if (error) return res.status(404).json({ error: "internal server error...!" });

          if (results.length === 0) return res.json({ error: "Your email or password is invalid!" });

          const id = results[0].UUID;
          const email = results[0].EMAIL;
          const isVerified = results[0].IS_VERIFIED;
          const is2FA = results[0].AUTH_2FA;

          if (is2FA === 1) {
               res.status(200).json({ response: "Two Factor Authentication is enabled!", status: "2FA", uuid: id, email: email });
               send2FACode(id, email);
          }
          else if (isVerified === 2) {
               res.cookie("UUID", id, { path: "/", httpOnly: false, maxAge: 30 * 24 * 60 * 60 * 1000, secure: false });
               res.status(200).json({ response: "Your are successfully logged in!", status: 200, uuid: id, email: email });
          } else if (isVerified == 1) {
               const mailOptions = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: "Your Convo Chat Account Verification OTP Code",
                    html: getEmailVerifyTemplate(results[0].USERNAME, email, createUniqueOTP().toString()),
               }
               transporter.sendMail(mailOptions, (error, info) => {
                    if (error) res.status(500).send({ error: "Failed to send email" });
               });
               return res.json({ error: "Your account is not verified!", status: 307, uuid: id, email: email });
          }

     });

});


/*
     * Endpoint to send email verification for new user registration
     * URL - localhost:5000/api/v1/user/send-email-verification
     * Method - POST
     * Body - JSON object with email, password, username
     * Response - JSON object with response status and UUID or error message
*/
router.post("/register", (req, res) => {

     const { email, password, username } = req.body;

     if (Validator.isUsernameValid(username)) return res.json(Validator.isUsernameValid(username));
     else if (Validator.isEmailValid(email)) return res.json(Validator.isEmailValid(email));
     else if (Validator.isPasswordValid(password)) return res.json(Validator.isPasswordValid(password));

     const otp = createUniqueOTP();
     const UUID = UUIDv4();
     const date = currentDate();

     let mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "Your Convo Chat Account Verification OTP Code",
          html: getEmailVerifyTemplate(username, email, otp),
     };

     const selectQuery = "SELECT * FROM `users` WHERE `EMAIL` = ? AND `PASSWORD` = ?";
     const selectParams = [email, password];
     const insertQuery = "INSERT INTO `users` ( `UUID` , `USERNAME` ,  `EMAIL` , `PASSWORD` , `JOINED_DATE` , `VCODE` , `IS_ACTIVE` , `IS_VERIFIED` ) VALUES ( ? , ? , ? , ? , ? , ? , ? , ? )";
     const insertParams = [UUID, username, email, password, date, otp, "true", 1];

     database.query(selectQuery, selectParams, (error, results) => {
          if (error) return res.status(500).json({ error: "Database error" });
          if (results.length === 0) {
               database.query(insertQuery, insertParams, (error) => {
                    if (error) return res.status(500).json({ error: "Database error" });
                    res.status(200).json({ response: "success", UUID: UUID, email: email });
               });
          } else return res.status(200).json({ err: "user already exists! Please sign in." });
     });

     transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
               return res.status(500).send({ error: "Failed to send email" });
          }
     });

});

/*
     * Endpoint to resend OTP for 2FA
     * URL - localhost:5000/api/v1/auth/resend-otp
     * Method - POST
     * Body - JSON object with user ID
     * Response - JSON object with response status or error message
     * tested - yes
*/
router.post('/resend-otp', (req, res) => {
     let email;
     const { id } = req.body;
     console.log("[resend-otp] Request received: id : " + id);
     if (!id) return res.status(400).json({ error: "[ERROR] User ID is required" });
     const selectQuery = "SELECT EMAIL FROM `users` WHERE `UUID` = ?";
     const selectParams = [id];
     database.query(selectQuery, selectParams, (error, results) => {
          if (error) return res.status(404).json({ error: "Database error" });
          if (results.length === 0) return res.status(404).json({ error: "User not found" });
          email = results[0].EMAIL;
          send2FACode(id, email);
          res.status(200).json({ response: "OTP resent successfully", email: email });
     });
});

/*
     * Endpoint to verify OTP for 2FA
     * URL - localhost:5000/api/v1/auth/verify-otp
     * Method - POST
     * Body - JSON object with OTP code and user ID
     * Response - JSON object with response status or error message
     * tested - yes
*/
router.post("/verify-otp", (req, res) => {

     const { code, uuid } = req.body;

     if (!uuid) return res.status(404).json({ error: "User id is required" });
     else if (!code) res.json({ error: "Please enter your OTP Code" });

     const query = "SELECT * FROM `users` WHERE `UUID` = ? AND `VCODE` = ?";
     const params = [uuid, code];

     database.query(query, params, (error, results) => {
          if (error) res.status(500).json({ status: 500, error: "Internal server error..!" });
          if (results.length === 1) {
               const updateQuery = "UPDATE `users` SET `IS_VERIFIED` = ? WHERE `UUID` = ?";
               const updateParams = [2, uuid];
               database.query(updateQuery, updateParams, (error) => {
                    if (error) res.status(500).json({ status: 500, error: "Internal server error..!" });
                    res.status(200).json({ status: 200, response: "OTP successfully verified" });
               });
          } else res.json({ status: 404, error: "Your OTP Code is invalid!" });
     });
});

/*
     * Endpoint to handle 2FA settings for a user
     * URL - localhost:5000/api/v1/user/2FA-Handle
     * Method - POST
     * Body - JSON object with id (user ID) and status (boolean)
     * Response - JSON object with response status or error message
*/
router.post('/2FA-Handle', (req, res) => {

     const { id, status } = req.body;
     if (!id && !status) res.status(404).json({ error: 'User ID and status are required' });

     const query = "SELECT AUTH_2FA FROM `users` WHERE UUID = ?";
     const params = [id];

     database.query(query, params, (error, results) => {
          if (error) res.status(500).json({ error: 'Database error' });
          if (status) {
               database.query("UPDATE `users` SET `AUTH_2FA` = ? WHERE UUID = ?", [1, id], (err) => {
                    if (err) res.status(500).json({ error: 'Database error' });
               });
          } else {
               if (results[0].AUTH_2FA === 1) {
                    database.query("UPDATE `users` SET `AUTH_2FA` = ? WHERE UUID = ?", [0, id], (err) => {
                         if (err) res.status(500).json({ error: 'Database error' });
                    });
               }
          }
     });
});

/*
     * Endpoint to get 2FA status for a user
     * URL - localhost:5000/api/v1/auth/2FA-status
     * Method - POST
     * Body - JSON object with userId
     * Response - JSON object with 2FA status or error message
*/
router.post('/2FA-status', (req, res) => {

     const { userId } = req.body;
     if (!userId) res.status(400).json({ error: 'User ID is required' });

     const query = "SELECT AUTH_2FA FROM `users` WHERE UUID = ?";
     const params = [userId];

     database.query(query, params, (error, results) => {
          if (error) res.status(500).json({ error: 'Database error' });
          if (results.length > 0) res.status(200).json({ status: results[0].AUTH_2FA });
     });
});

/*
     * Endpoint to verify 2FA code during login
     * URL - localhost:5000/api/v1/auth/2FA-verify
     * Method - POST
     * Body - JSON object with uuid (user ID) and code (verification code)
     * Response - JSON object with response status or error message
*/
router.post('/2FA-verify', (req, res) => {

     const { uuid, code } = req.body;
     if (!uuid || !code) return res.status(400).json({ error: 'user id and verification code are required' });

     const query = "SELECT VCODE FROM users WHERE UUID = ?";
     const params = [uuid];

     const updateQuery = "UPDATE users SET IS_VERIFIED = ? WHERE UUID = ?";
     const updateParams = [2, uuid];

     database.query(query, params, (error, results) => {
          if (error) return res.status(500).json({ error: 'Database error' });
          if (results.length > 0 && results[0].VCODE === code) {
               database.query(updateQuery, updateParams, (error) => {
                    if (error) return res.status(500).json({ error: 'Database error' });
                    res.cookie("UUID", uuid, {
                         path: "/",
                         httpOnly: false,
                         maxAge: 30 * 24 * 60 * 60 * 1000,
                         secure: false,
                    });
                    return res.status(200).json({ message: 'Two-factor authentication verified successfully' });
               });
          } else return res.status(400).json({ error: 'Invalid verification code' });
     });
});


module.exports = router;