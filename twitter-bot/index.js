// Command line parameters (all optional):
//
// --date 2022-01-22:   Solve the puzzle for a specific day.
//                      If not provided, today's puzzle is solved.
// --headful:           Runs the script in non-headless mode
// --skip-tweet:        Does not tweet the result
// --skip-image-upload: Does not upload a screenshot of the result
// --use-local-script:  Uses the local (compiled) index.js instead
//                      of sourcing the script from UNPKG
//
// Example usage:
//
// yarn solve --date=2021-10-10 --headful --skip-tweet --use-local-script

const puppeteer = require('puppeteer');
const { TwitterApi } = require('twitter-api-v2');
const yargs = require('yargs/yargs');
const fs = require('fs').promises;
const path = require('path');
const { mockPageDate } = require('./mock-page-date');
const {
  screenshotAndUploadToImgur,
} = require('./screenshot-and-upload-to-imgur');

const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;

const asyncTimeout = (timeout) =>
  new Promise((resolve) => setTimeout(() => resolve(), timeout));

const clickModalCloseButton = async (page) => {
  await page.evaluate((_) => {
    document
      .querySelector('game-app')
      .shadowRoot.querySelector('game-modal')
      .shadowRoot.querySelector('game-icon[icon="close"]')
      .click();
  });

  await asyncTimeout(500);
};

(async () => {
  const browser = await puppeteer.launch({
    headless: !argv.headful,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: 540,
    height: 800,
  });

  if (argv.date) {
    await mockPageDate(page, new Date(argv.date).getTime());
  }

  await page.emulateTimezone('GMT');

  await page.goto('https://www.powerlanguage.co.uk/wordle/', {
    waitUntil: 'networkidle2',
  });

  await clickModalCloseButton(page);

  if (argv.useLocalScript) {
    // Useful for debugging locally.
    // Make sure you've already run `yarn tsc` in the parent
    // folder, otherwise `build/index.js` won't exist.
    const scriptCode = await fs.readFile(
      path.resolve(__dirname, '../build/index.js'),
      { encoding: 'utf-8' },
    );

    await page.evaluate((scriptCode) => {
      const scriptEl = document.createElement('script');
      scriptEl.appendChild(document.createTextNode(scriptCode));
      document.body.appendChild(scriptEl);
    }, scriptCode);
  } else {
    // Useful for CI - no need to build src/index.ts first
    await page.evaluate((_) => {
      document.body.appendChild(document.createElement('script')).src =
        'https://unpkg.com/@nfriend/wordle-solver/build/index.js';
    });
  }

  const solved = await new Promise((resolve) => {
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Solved!')) {
        resolve(true);
      }
      if (text.includes('Failed!')) {
        resolve(false);
      }
    });
  });

  // Interacting with the clipboard seems challenging/impossible
  // within Puppeteer, so instead we'll just manually generate
  // our own share text.
  const { wordleCount, shareText, guessesText } = await page.evaluate(
    (solved) => {
      const gameState = getGameState();

      const guessCount = solved ? gameState.guesses.length : 'X';

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
        const correctGuessIndicator = solved && isLastGuess ? ' ✅' : '';
        guessesTextLines.push(
          `${guessCount}. ${guessWord}${correctGuessIndicator}`,
        );
      });

      return {
        wordleCount,
        shareText: shareTextLines.join('\n'),
        guessesText: guessesTextLines.join('\n'),
      };
    },
    solved,
  );

  await asyncTimeout(2500);

  await clickModalCloseButton(page);

  console.log(shareText);
  console.log();
  console.log(guessesText);
  console.log();

  let solutionScreenshotLink = '';

  if (!argv.skipImageUpload) {
    try {
      const imgUrl = await screenshotAndUploadToImgur(
        page,
        `Wordle ${wordleCount}`,
        guessesText,
      );

      console.log('Imgur screenshot link:', imgUrl);
      solutionScreenshotLink = `\n\nFull solution [#SPOILER!]: ${imgUrl}`;
    } catch (e) {
      console.error('An error occured while screenshoting/uploading to Imgur!');
      console.error(e);
    }
  }

  if (!argv.skipTweet) {
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
    await twitterClient.v2.tweet(shareText + solutionScreenshotLink);
  }

  await browser.close();
})();
