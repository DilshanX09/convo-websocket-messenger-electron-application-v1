const createUniqueOTP = () => {
     let code;
     code = Math.floor(1000 + Math.random() * 9000);
     return code;
}

module.exports = createUniqueOTP;
