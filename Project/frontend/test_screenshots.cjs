const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Intercept console messages
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
       console.log('PAGE ERROR LOG:', text);
    }
  });
  page.on('pageerror', error => console.log('UNCAUGHT EXCEPTION:', error.message));

  // Navigate and set fake user
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('user', JSON.stringify({
      id: "5",
      email: "ambunglay@gmail.com",
      role: "FREELANCER",
      displayName: "Dương Hồ Chí"
    }));
  });

  console.log("Navigating to home page as freelancer...");
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });

  // Test Profile tab
  console.log("Setting currentPage = profile");
  await page.evaluate(() => {
    sessionStorage.setItem('currentPage', 'profile');
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screenshot_profile.png' });
  
  // Test Edit Profile tab
  console.log("Setting currentPage = edit_profile");
  await page.evaluate(() => {
    sessionStorage.setItem('currentPage', 'edit_profile');
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screenshot_edit_profile.png' });
  
  // Test Preferences tab
  console.log("Setting currentPage = preferences");
  await page.evaluate(() => {
    sessionStorage.setItem('currentPage', 'preferences');
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screenshot_preferences.png' });
  
  // Test Revenue tab
  console.log("Setting currentPage = revenue");
  await page.evaluate(() => {
    sessionStorage.setItem('currentPage', 'revenue');
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screenshot_revenue.png' });
  
  await browser.close();
  console.log("Screenshots captured!");
})();
