const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto('http://localhost:5174/', { timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/app-screenshot.png', fullPage: true });
    console.log('Screenshot saved');
    const title = await page.title();
    console.log('Page title:', title);
    const html = await page.evaluate(() => document.querySelector('#root')?.innerHTML?.substring(0, 200));
    console.log('Root HTML:', html);
    await browser.close();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
