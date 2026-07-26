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
      id: "5",
      email: "ambunglay@gmail.com",
      role: "FREELANCER",
      displayName: "Dương Hồ Chí"
    }));
    sessionStorage.setItem('currentPage', 'home');
  });

  console.log("Navigating to home page...");
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });

  // Click the avatar to open menu
  console.log("Clicking avatar to open menu...");
  // We can just find the button that opens the menu. The avatar image is a button.
  // In Navbar.jsx, the profile menu button has an img or div. Let's find it by role or class.
  // Usually it's the last button in the navbar.
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    // Find the one containing the user's avatar or text
    const avatarBtn = btns.find(b => b.innerHTML.includes('Dương Hồ Chí') || b.innerHTML.includes('rounded-full'));
    if (avatarBtn) avatarBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // Click "Hồ sơ cá nhân"
  console.log("Clicking 'Hồ sơ cá nhân'...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Hồ sơ cá nhân'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_click_profile.png' });
  console.log("Screenshot saved.");

  await browser.close();
})();
