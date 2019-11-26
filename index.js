const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--incognito'],
    headless: false
  });
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com/toyotavnsports/posts/669934053429917');

  process.on('SIGTERM', async () => {
    await browser.close();
  });
})();
