const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.log('PAGE ERROR LOG:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('UNCAUGHT EXCEPTION:', error.message));

  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('user', JSON.stringify({
      id: "7",
      email: "freelancer@lancerpro.com",
      role: "FREELANCER",
      displayName: "Freelancer"
    }));
  });

  console.log("Navigating to home page...");
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });

  // Test Profile tab
  console.log("Setting currentPage = profile");
  await page.evaluate(() => {
    sessionStorage.setItem('currentPage', 'profile');
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Test Edit Profile tab
  console.log("Setting currentPage = edit_profile");
  await page.evaluate(() => {
    sessionStorage.setItem('currentPage', 'edit_profile');
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  await browser.close();
  console.log("Done");
})();
