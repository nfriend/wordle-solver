/**
 * Mocks the `Date` object in Puppeteer with a fake date.
 * Copied verbatim from https://stackoverflow.com/a/60166824/1063392
 *
 * @param {Object} page The current Puppeteer page object
 * @param {Number} desiredDate The date to set the mock to
 */
const mockPageDate = async (page, desiredDate) => {
  // mock date of document
  if (!page.dateIsMocked) {
    page.dateIsMocked = true;
    await page.evaluateOnNewDocument((desiredDate) => {
      var _Date = Date,
        _getTimezoneOffset = Date.prototype.getTimezoneOffset,
        now = null;
      function MockDate(y, m, d, h, M, s, ms) {
        var date;
        switch (arguments.length) {
          case 0:
            if (now !== null) {
              date = new _Date(now);
            } else {
              date = new _Date();
            }
            break;
          case 1:
            date = new _Date(y);
            break;
          default:
            d = typeof d === 'undefined' ? 1 : d;
            h = h || 0;
            M = M || 0;
            s = s || 0;
            ms = ms || 0;
            date = new _Date(y, m, d, h, M, s, ms);
            break;
        }

        return date;
      }
      MockDate.UTC = _Date.UTC;
      MockDate.now = function () {
        return new MockDate().valueOf();
      };
      MockDate.parse = function (dateString) {
        return _Date.parse(dateString);
      };
      MockDate.toString = function () {
        return _Date.toString();
      };
      MockDate.prototype = _Date.prototype;

      function set(date, timezoneOffset) {
        var dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          throw new TypeError(
            'mockdate: The time set is an invalid date: ' + date,
          );
        }
        if (typeof timezoneOffset === 'number') {
          MockDate.prototype.getTimezoneOffset = function () {
            return timezoneOffset;
          };
        }
        Date = MockDate;
        now = dateObj.valueOf();
      }

      // mock date
      set(desiredDate);
    }, desiredDate);
  }
};

module.exports = { mockPageDate };
