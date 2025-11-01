const path = require('path');
const fs = require('fs');

const getEmailVerifyTemplate = (username, email, otp) => {
     const templatePath = path.join(__dirname, '..', 'templates', 'email-verify-template.html');
     let html = fs.readFileSync(templatePath, 'utf8');
     html = html.replace(/\$\{USERNAME\}/g, username).replace(/\$\{EMAIL\}/g, email).replace(/\$\{OTP\}/g, otp);
     return html;
}

module.exports = getEmailVerifyTemplate;