const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:8000');
  await page.waitForTimeout(2000);

  // Try to screenshot just the sidebar
  const sidebar = await page.$('aside.sidebar');
  if (sidebar) {
    await sidebar.screenshot({ path: 'sidebar_screenshot.png' });
    console.log('Sidebar screenshot saved to sidebar_screenshot.png');
  } else {
    // Try other selectors
    const aside = await page.$('aside');
    if (aside) {
      await aside.screenshot({ path: 'sidebar_screenshot.png' });
      console.log('Aside screenshot saved to sidebar_screenshot.png');
    } else {
      await page.screenshot({ path: 'full_screenshot.png', fullPage: false });
      console.log('Full screenshot saved to full_screenshot.png');
    }
  }

  // Also get some info about the elements
  const newChatBtn = await page.$('.new-chat-btn, #new-chat-btn, [data-action="new-chat"], button');
  if (newChatBtn) {
    const text = await newChatBtn.textContent();
    console.log('Found button with text:', text);
  }

  await browser.close();
})();
