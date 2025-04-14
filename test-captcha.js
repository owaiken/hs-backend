require('dotenv').config();
const axios = require('axios');

async function solveCaptcha({ siteKey, url, method = 'capmonster' }) {
  if (!method) throw new Error('Missing captcha method');

  // ---- CapMonster (default) ----
  if (method.toLowerCase() === 'capmonster') {
    const apiKey = process.env.CAPMONSTER_API_KEY;
    if (!apiKey) throw new Error('Missing CAPMONSTER_API_KEY in .env');

    const createResp = await axios.post('https://api.capmonster.cloud/createTask', {
      clientKey: apiKey,
      task: {
        type: 'NoCaptchaTaskProxyless',
        websiteURL: url,
        websiteKey: siteKey,
      }
    });

    if (createResp.data.errorId !== 0) {
      throw new Error(`CapMonster task creation failed: ${createResp.data.errorDescription}`);
    }

    const taskId = createResp.data.taskId;

    for (let i = 0; i < 24; i++) {
      await new Promise((res) => setTimeout(res, 5000));

      const resultResp = await axios.post('https://api.capmonster.cloud/getTaskResult', {
        clientKey: apiKey,
        taskId,
      });

      if (resultResp.data.status === 'ready') {
        return resultResp.data.solution.gRecaptchaResponse;
      } else if (resultResp.data.errorId !== 0) {
        throw new Error(`CapMonster error: ${resultResp.data.errorDescription}`);
      }
    }

    throw new Error('CapMonster solving timed out after ~2 minutes.');
  }

  // ---- 2Captcha ----
  if (method.toLowerCase() === '2captcha') {
    const apiKey = process.env.TWOCAPTCHA_API_KEY;
    if (!apiKey) throw new Error('Missing TWOCAPTCHA_API_KEY in .env');

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
        throw new Error(`2Captcha solve failed: ${resultResp.data.request}`);
      }
    }

    throw new Error('2Captcha solving timed out after ~2 minutes.');
  }

  throw new Error(`Captcha method "${method}" is not supported`);
}

module.exports = { solveCaptcha };
