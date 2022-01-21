const puppeteer = require('puppeteer');

const asyncTimeout = (timeout) =>
  new Promise((resolve) => setTimeout(() => resolve(), timeout));

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const context = browser.defaultBrowserContext();
  context.overridePermissions('https://www.powerlanguage.co.uk', [
    'clipboard-read',
    'clipboard-write',
  ]);
  const page = await browser.newPage();
  await page.goto('https://www.powerlanguage.co.uk/wordle/', {
    waitUntil: 'networkidle2',
  });

  await page.evaluate((_) => {
    document
      .querySelector('game-app')
      .shadowRoot.querySelector('game-modal')
      .shadowRoot.querySelector('game-icon')
      .click();
  });

  await asyncTimeout(500);

  await page.evaluate((_) => {
    document.body.appendChild(document.createElement('script')).src =
      'https://unpkg.com/@nfriend/wordle-solver/build/index.js';
  });

  await new Promise((resolve) => {
    page.on('console', (msg) => {
      if (msg.text().includes('Solved!')) {
        resolve();
      }
    });
  });

  await asyncTimeout(5000);

  await page.evaluate((_) => {
    document
      .querySelector('game-app')
      .shadowRoot.querySelector('game-stats')
      .shadowRoot.querySelector('button#share-button')
      .click();
  });

  await asyncTimeout(3000);

  const shareText = await page.evaluate((_) => navigator.clipboard.readText());

  console.log('share text:', shareText);

  await browser.close();
})();
