# Bench

> WARNING: This is very much alpha!

Using [Phantomas](https://github.com/macbre/phantomas) (a [PhantomJS](http://phantomjs.org/) backed client performance metrics scrapper). Benchmark a page, store results in MongoDB and display result via the built in server.

> Note to Window's Users
>
> Sorry guys, I try to make my stuff work for you without having access to a Window's box to test on. In this case not so much. I'm using `make` or `gmake` to install [Phantomas](https://github.com/macbre/phantomas) at this time. You're welcome to fork and submit a pull request with a downloader/extractor that works on Windows, Mac and (most importantly) Linux.
>
> Note to Mac Users
>
> This should work for you, but I don't have access to a Mac to test on. Open a [bug](https://github.com/jmervine/bench/issues) if you're having issues and I'll try to find someone's Mac to debug this on.

### Install

1. Install [Node.js](http://nodejs.org)
2. Install [mongodb](http://www.mongodb.org/)
3. Install `bench`

```
git clone https://github.com/jmervine/bench.git
cd bench
make setup

# npm install is supported (but may be buggy) via:
# $ npm install -g jmervine/bench
```

> See [Phapper](http://mervine.net/projects/npms/phapper) if you're having issues with PhantomJS.


### Usage

1. Update configuration (`./config.json') to reflect your host, path and thresholds.
2. Run:

```
# see: node ./index.js --help
node ./index.js "http://example.com"
# if via npm
# $ bench --help
# $ bench "http://example.com"
```

> Note: Ignore `init`, it's not needed with a git checkout. It's for `npm install`, which isn't working yet.

3. Start server:

```
node ./index.js server
# if via npm
# $ bench server
```

### UI Screenshot (as of Aug 27 2013)

![Bench UI](http://mervine.net/pages/bench2.png)

### Working Example

See a working example of this for my blog ([mervine.net](http://mervine.net)) at [bench.mervine.net](http://bench.mervine.net).

