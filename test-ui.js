const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));
  await page.goto('http://localhost:3000/?bust=' + Date.now(), { waitUntil: 'networkidle' });
  
  const isCadastrarVisible = await page.isVisible('#tabSignup');
  console.log('Tab Cadastrar visible?', isCadastrarVisible);
  
  await page.click('#tabSignup');
  await page.waitForTimeout(500);
  
  const isFormVisible = await page.isVisible('#signupForm');
  console.log('Form Signup visible?', isFormVisible);

  await browser.close();
})();
