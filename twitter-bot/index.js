const puppeteer = require('puppeteer');
const { TwitterApi } = require('twitter-api-v2');

const asyncTimeout = (timeout) =>
  new Promise((resolve) => setTimeout(() => resolve(), timeout));

(async () => {
  const browser = await puppeteer.launch();
  const context = browser.defaultBrowserContext();
  const page = await browser.newPage();
  await page.emulateTimezone('GMT');
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

  // Interacting with the clipboard seems challenging/impossible
  // within Puppeteer, so instead we'll just manually generate
  // our own share text.
  const shareText = await page.evaluate((_) => {
    const gameState = getGameState();

    const results = [];

    const guessCount = gameState.guesses.length;

    // These three lines are more or less copied from Wordle's source
    const s = new Date('2021-06-19');
    const t = new Date().setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0);
    const wordleCount = Math.round(t / 864e5);

    results.push(`Wordle ${wordleCount} ${guessCount}/6`);
    results.push('');
    gameState.guesses.forEach((guess) => {
      const resultLine = guess.letters
        .map((letter) => {
          if (letter.evaluation === 'correct') {
            return '🟩';
          } else if (letter.evaluation === 'present') {
            return '🟨';
          } else {
            return '⬜';
          }
        })
        .join('');

      results.push(resultLine);
    });

    return results.join('\n');
  });

  console.log(shareText);

  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
  await twitterClient.v2.tweet(shareText);

  await browser.close();
})();
