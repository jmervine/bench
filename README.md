# Bench

> WARNING: This is very much alpha!

A combination of [HTTPerf.js](http://mervine.net/projects/npms/httperfjs), [YSlow.js](http://mervine.net/projects/npms/yslowjs) and [Phantomas](https://github.com/macbre/phantomas) (a [PhantomJS](http://phantomjs.org/) backed client performance metrics scrapper). Benchmark a page against configurated thresholds and fail if not met. Additionally, basic graphing of last 10 results.

> Note to Window's Users
>
> Sorry guys, I try to make my stuff work for you without having access to a Window's box to test on. In this case not so much. I'm using `make` or `gmake` to install [Phantomas](https://github.com/macbre/phantomas) at this time. You're welcome to fork and submit a pull request with a downloader/extractor that works on Windows, Mac and (most importantly) Linux.
>
> Note to Mac Users
>
> This should work for you, but I don't have access to a Mac to test on. Open a [bug](https://github.com/jmervine/bench/issues) if you're having issues and I'll try to find someone's Mac to debug this on.

### Install

1. Install [Node.js](http://nodejs.org)
2. Install [httperf](http://www.hpl.hp.com/research/linux/httperf/), optionally to use my version, see [httperf-0.9.1 with individual connection times](http://mervine.net/httperf-0-9-1-with-individual-connection-times).
3. Install `bench`
```
    git clone https://github.com/jmervine/bench.git
    cd bench
    make setup
```

> See [Phapper](http://mervine.net/projects/npms/phapper) if you're having issues with PhantomJS.


### Usage

1. Update configuration (`./config.json') to reflect your host, path and thresholds.
2. Run:
```
    make bench # runs ./config.json

    # or with cli
    node ./index.js --help
```
> Note: Ignore `init`, it's not needed with a git checkout. It's for `npm install`, which isn't working yet.

3. Open `./index.html` in a browser to view graph of multiple runs.

### Working Example

See a working example of this for my blog ([mervine.net](http://mervine.net)) at [bench.mervine.net](http://bench.mervine.net).

