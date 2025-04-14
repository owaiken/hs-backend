// puppeteer-runner.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertLog } = require('./webhook-logger');

puppeteer.use(StealthPlugin());

async function runBotTask(task, meta) {
  const { product_id, site, size, id: taskId } = task;
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

    // --- Example automation for demo (to be expanded per site) ---
    if (site.toLowerCase() === 'nike') {
      await page.goto('https://www.nike.com/launch');
      await log(`Navigated to Nike Launch page.`);

      // You would now use product_id/keywords to locate item
      await page.waitForTimeout(2000); // Simulate monitor delay
      await log(`Checking availability for product: ${product_id}`);

      // Placeholder success logic
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
