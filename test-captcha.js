// test-captcha.js
require('dotenv').config();
const { solveCaptcha } = require('./captcha-solver');

(async () => {
  try {
    console.log('[TEST] Solving captcha with capmonster...');

    const token = await solveCaptcha({
      siteKey: '6Lez6M8ZAAAAABxgU5aHfhZS3-fpZ60h2Y9asJSo', // Replace with real site key if needed
      url: 'https://example.com', // Replace with real target URL if needed
      method: 'capmonster'
    });

    console.log('[SUCCESS] Captcha token:', token);
  } catch (err) {
    console.error('[ERROR]', err.message);
  }
})();
