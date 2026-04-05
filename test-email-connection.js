const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Testing connection with:');
console.log('USER:', process.env.EMAIL_USER);
console.log('PASS LENGTH:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connection error:', error);
    process.exit(1);
  } else {
    console.log('✅ Connection successful! Ready to send emails.');
    process.exit(0);
  }
});
