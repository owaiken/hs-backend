const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertLog } = require('./webhook-logger');
const { solveCaptcha } = require('./captcha-solver');

puppeteer.use(StealthPlugin());

async function runBotTask(task, meta) {
  const { product_id, site, size, id: taskId, captcha_method = '2captcha' } = task;
  const logs = [];

  const log = async (message, type = 'info') => {
    logs.push({ task_id: taskId, message, type });
    await insertLog(taskId, message, type);
    console.log(`[${type}] ${message}`);
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0');
    await log(`Launching browser for ${site}`);

    if (site.toLowerCase() === 'nike') {
      await page.goto('https://www.nike.com/launch', { waitUntil: 'domcontentloaded' });
      await log(`Navigated to Nike Launch page.`);

      await page.waitForTimeout(2000);
      await log(`Checking availability for product: ${product_id}`);

      // 📌 Captcha handling
      const captchaSiteKey = 'SITE_KEY_HERE'; // Replace with real site key if needed
      const captchaSelector = '#g-recaptcha-response';

      const captchaExists = await page.$(captchaSelector);
      if (captchaExists) {
        await log(`Captcha detected. Solving using ${captcha_method}...`);

        try {
          const token = await solveCaptcha({
            siteKey: captchaSiteKey,
            url: page.url(),
            method: captcha_method
          });

          await page.evaluate((token) => {
            document.getElementById("g-recaptcha-response").innerHTML = token;
          }, token);

          await log(`Captcha solved and token injected.`);
        } catch (captchaErr) {
          await log(`Captcha solve failed: ${captchaErr.message}`, 'error');
          return { success: false, message: 'Captcha failed' };
        }
      }

      await log(`Simulated checkout complete!`, 'success');
      return { success: true, message: 'Checkout simulated' };
    }

    await log(`No site automation module found for ${site}`, 'error');
    return { success: false, message: 'Unsupported site' };
  } catch (err) {
    await log(`Bot error: ${err.message}`, 'error');
    return { success: false, message: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { runBotTask };
