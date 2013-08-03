# Bench

> WARNING: This is very much alpha!

A combination of [HTTPerf.js](http://mervine.net/projects/npms/httperfjs), [YSlow.js](http://mervine.net/projects/npms/yslowjs) and [Phantomas](https://github.com/macbre/phantomas) (a [PhantomJS](http://phantomjs.org/) backed client performance metrics scrapper). Benchmark a page against configurated thresholds and fail if not met. Additionally, basic graphing of last 10 results.

### Install

1. Install [Node.js](http://nodejs.org)
2. Install [httperf](http://www.hpl.hp.com/research/linux/httperf/), optionally to use my version, see [httperf-0.9.1 with individual connection times](http://mervine.net/httperf-0-9-1-with-individual-connection-times).
3. Clone Repo:

    git clone https://github.com/jmervine/bench.git
    cd bench
    make setup
    
> See [Phapper](http://mervine.net/projects/npms/phapper) if you're having issues with PhantomJS.


### Usage

1. Update configuration (`./config.json') to reflect your host, path and thresholds.
2. Run:

    make bench

3. Open `./index.html` in a browser to view graph of multip runs.

### Working Example

See a working example of this for my blog ([mervine.net](http://mervine.net)) at [bench.mervine.net](http://bench.mervine.net).

