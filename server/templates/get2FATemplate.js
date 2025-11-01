const path = require('path');
const fs = require('fs');

const get2FATemplate = (code, email) => {
     const templatePath = path.join(__dirname, '..', 'templates', '2fa-email-template.html');
     let html = fs.readFileSync(templatePath, 'utf8');
     html = html.replace(/\$\{OTP\}/g, code).replace(/\$\{EMAIL\}/g, email);
     return html;
}

module.exports = get2FATemplate;