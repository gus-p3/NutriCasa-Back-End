const dotenv = require('dotenv');
dotenv.config();

const API_URL = 'https://api.brevo.com/v3/smtp/email';
const API_KEY = process.env.EMAIL_PASS;
const SENDER_EMAIL = process.env.EMAIL_USER;

async function testBrevoAPI() {
  console.log('Testing Brevo API connection...');
  console.log('SENDER:', SENDER_EMAIL);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'NutriCasa Test', email: SENDER_EMAIL },
        to: [{ email: SENDER_EMAIL }], // Send to self for testing
        subject: 'Test Brevo API NutriCasa',
        htmlContent: '<html><body><h1>Connection successful!</h1><p>This is a test from NutriCasa.</p></body></html>',
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Success! Email sent via API. ID:', data.messageId);
    } else {
      console.error('❌ API Error:', response.status, data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

testBrevoAPI();
