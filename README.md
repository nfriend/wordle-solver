# Wordle (and Absurdle) Solver

[![npm
(scoped)](https://img.shields.io/npm/v/@nfriend/wordle-solver)](https://www.npmjs.com/package/@nfriend/wordle-solver)
<a href="https://gitlab.com/nfriend/wordle-solver/pipelines"
  target="_blank"><img
  src="https://gitlab.com/nfriend/wordle-solver/badges/main/pipeline.svg"
  alt="Twitter bot status"></a> [![Twitter
Follow](https://img.shields.io/twitter/follow/bot_wordle?style=social)](https://twitter.com/bot_wordle)

<img alt="The wordle-bot logo" src="img/wordle-bot.png" height="300" />

A bookmarklet and Twitter bot that automatically solves [the daily Wordle
puzzle](https://www.nytimes.com/games/wordle/index.html).

It also solves a fun variant:
[Absurdle](https://qntm.org/files/wordle/index.html).

## Wordle demo

<img alt="A demo of this script solving a daily Wordle puzzle"
src="img/wordle-demo.gif" width="701" />

## Absurdal demo

<img alt="A demo of this script solving the Absurdal puzzle"
src="img/absurdal-demo.gif" width="618" />

## Twitter bot

Every morning, [this Twitter bot](https://twitter.com/bot_wordle) uses this
script to solve the daily Wordle puzzle and posts its results.

<img alt="A screenshot of a Tweet by @bot_wordle" src="img/tweet.png"
width="507" />

The tweet will include a link to a screenshot of the full solution.

Source for the Twitter bot can be seen in
[`twitter-bot/index.js`](twitter-bot/index.js). The bot is run inside a GitLab
scheduled pipeline (see [`.gitlab-ci.yml`](.gitlab-ci.yml)).

## Usage

In your browser of choice, create a new toolbar bookmark. Name the bookmark
something like "Solve Wordle", and paste the following code into the "URL"
field:

<!-- prettier-ignore -->
```js
javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://unpkg.com/@nfriend/wordle-solver/build/index.js';})();
```

<img alt="A screenshot of the 'add new bookmark' dialog in Firefox"
src="img/bookmarklet-screenshot.png" width="469">

Then, navigate to [Wordle](https://www.nytimes.com/games/wordle/index.html) or
[Absurdle](https://qntm.org/files/wordle/index.html) and click your new "Solve
Wordle" bookmarklet!

## Releases

This script is published to [NPM as
`@nfriend/wordle-solver`](https://www.npmjs.com/package/@nfriend/wordle-solver)
and is available as a downloadable script here:
https://unpkg.com/@nfriend/wordle-solver/build/index.js.

## Developing

### Bookmarklet

Clone this repository, and in the root directory, run:

- `yarn`
- `yarn tsc --watch`

`build/index.js` will be automatically updated every time `src/index.ts` is
changed.

To run `build/index.js`, copy its contents and paste into the developer tools of
a Wordle or Absurdal page.

#### Releasing a new version

To release a new version of the bookmarklet:

1. Run `yarn tsc` to ensure `build/index.js` is up to date
1. Run `yarn version --[patch|minor|major]`
1. Run `npm publish`
1. Run `git push`
1. Run `git push --tags`
1. Create a new [release on
   GitLab](https://gitlab.com/nfriend/wordle-solver/-/releases) using the tag
   created by `yarn` above

### Twitter bot

After running the steps in the **Bookmarklet** section above, navigate to the
`twitter-bot` directory and run:

- `yarn`
- `yarn solve --date=2021-10-10 --headful --skip-tweet --skip-image-upload --use-local-script`

See the comments in [`twitter-bot/index.js`](twitter-bot/index.js) for an
explanation of each command line parameter.

The API keys/secrets for both Twitter and Imgur are provided through environment
variables.
