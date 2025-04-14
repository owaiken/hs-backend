// captcha-solver.js
require('dotenv').config();
const axios = require('axios');

async function solveCaptcha({ siteKey, url, method = '2captcha' }) {
  const apiKey = process.env.TWOCAPTCHA_API_KEY;

  if (!apiKey) throw new Error('Missing TWOCAPTCHA_API_KEY in .env');

  if (method.toLowerCase() === '2captcha') {
    const submitResp = await axios.get('https://2captcha.com/in.php', {
      params: {
        key: apiKey,
        method: 'userrecaptcha',
        googlekey: siteKey,
        pageurl: url,
        json: 1,
      }
    });

    if (submitResp.data.status !== 1) {
      throw new Error(`2Captcha submit failed: ${submitResp.data.request}`);
    }

    const requestId = submitResp.data.request;

    // Poll for the solution
    for (let i = 0; i < 24; i++) {
      await new Promise(res => setTimeout(res, 5000));

      const resultResp = await axios.get('https://2captcha.com/res.php', {
        params: {
          key: apiKey,
          action: 'get',
          id: requestId,
          json: 1,
        }
      });

      if (resultResp.data.status === 1) {
        return resultResp.data.request;
      } else if (resultResp.data.request !== 'CAPCHA_NOT_READY') {
        throw new Error(`Captcha solve failed: ${resultResp.data.request}`);
      }
    }

    throw new Error('Captcha solving timed out after ~2 minutes.');
  }

  throw new Error(`Captcha method "${method}" not yet supported`);
}

module.exports = { solveCaptcha };
