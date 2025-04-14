// captcha-solver.js
require('dotenv').config();
const axios = require('axios');

async function solveCaptcha({ siteKey, url, method = '2captcha' }) {
  const apiKey = process.env.CAPTCHA_API_KEY;

  if (method === '2captcha') {
    const submitResp = await axios.get(`http://2captcha.com/in.php`, {
      params: {
        key: apiKey,
        method: 'userrecaptcha',
        googlekey: siteKey,
        pageurl: url,
        json: 1,
      }
    });

    if (submitResp.data.status !== 1) throw new Error('Failed to submit captcha');

    const requestId = submitResp.data.request;

    // Polling for the response
    for (let i = 0; i < 20; i++) {
      await new Promise((res) => setTimeout(res, 5000));

      const resultResp = await axios.get(`http://2captcha.com/res.php`, {
        params: {
          key: apiKey,
          action: 'get',
          id: requestId,
          json: 1,
        }
      });

      if (resultResp.data.status === 1) {
        return resultResp.data.request;
      }
    }

    throw new Error('Captcha solving timed out');
  }

  throw new Error(`Captcha method "${method}" not supported`);
}

module.exports = { solveCaptcha };
