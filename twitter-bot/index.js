const puppeteer = require('puppeteer');
const { TwitterApi } = require('twitter-api-v2');
const { mockPageDate } = require('./mock-page-date');
const yargs = require('yargs/yargs');

const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;

const asyncTimeout = (timeout) =>
  new Promise((resolve) => setTimeout(() => resolve(), timeout));

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  if (argv.date) {
    await mockPageDate(page, new Date(argv.date).getTime());
  }

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
  const { shareText, guessesText } = await page.evaluate((_) => {
    const gameState = getGameState();

    const guessCount = gameState.guesses.length;

    // These three lines are more or less copied from Wordle's source
    const s = new Date('2021-06-19');
    const t = new Date().setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0);
    const wordleCount = Math.round(t / 864e5);

    const shareTextLines = [`Wordle ${wordleCount} ${guessCount}/6\n`];
    const guessesTextLines = ['Guesses:\n'];

    gameState.guesses.forEach((guess, index) => {
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

      shareTextLines.push(resultLine);

      const isLastGuess = index === gameState.guesses.length - 1;
      const guessCount = index + 1;
      const guessWord = guess.letters
        .map((l) => l.letter)
        .join('')
        .toUpperCase();
      const correctGuessIndicator = isLastGuess ? ' ✅' : '';
      guessesTextLines.push(
        `${guessCount}. ${guessWord}${correctGuessIndicator}`,
      );
    });

    return {
      shareText: shareTextLines.join('\n'),
      guessesText: guessesTextLines.join('\n'),
    };
  });

  console.log(shareText);
  console.log();
  console.log(guessesText);

  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
  await twitterClient.v2.tweet(shareText);

  await browser.close();
})();