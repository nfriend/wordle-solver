// This script backfills the Twitter bot's feed
// with all past Wordle solutions

const exec = require('child_process').exec;

let date = new Date('2021-06-20');

(async () => {
  while (date < new Date()) {
    const dateStr = date.toISOString().slice(0, 10);

    console.log(`Solving Wordle for ${dateStr}`);

    await new Promise((resolve) => {
      exec(`yarn solve --date=${dateStr}`, (error, stdout) => {
        console.log(stdout);

        if (error) {
          console.log(error.code);
        }

        resolve();
      });
    });

    date.setDate(date.getDate() + 1);
  }
})();
