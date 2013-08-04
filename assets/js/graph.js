if (typeof results === 'undefined') {
    results = [];
}

if (typeof thresholds === 'undefined') {
    thresholds = [];
} else {
    thresholds = Object.keys(thresholds);
}

function expandKey(key) {
    // make yslow keys pretty
    switch (key) {
        case 'o'  : return 'overall';
        case 'w'  : return 'pageWeight';
        case 'r'  : return 'httpRequests';
        case 'lt' : return 'loadTime';
        default   : return key;
    }
}

function graphThresholds() {
    var data = [];
    var vals1 = [];
    var vals2 = [];

    thresholds.forEach(function(key) {
        data.push({label: key, data: [[0,undefined]], lines: {show: true}, points: {show: true}});
        var idata = data.length-1;
        data[idata].label = expandKey(key);

        results.forEach(function (result) {
            [ 'server', 'client', 'yslow' ].forEach(function(marker) {
                if (Object.keys(result[marker]).indexOf(key) !== -1) {
                    if (data[idata].label.indexOf(marker) === -1) {
                        data[idata].label = marker + ': ' + data[idata].label;
                    }
                    var val = result[marker][key];
                    if (val >= 500) {
                        data[idata].data.push([data[idata].data.length, (val/1000)]);
                        data[idata].yaxis = 2;
                        if (data[idata].label.indexOf('[RT]') === -1) {
                            data[idata].label = '[RT] '+data[idata].label;
                        }
                        vals2.push(val/1000);
                    } else {
                        data[idata].data.push([data[idata].data.length, val]);
                        if (data[idata].label.indexOf('[LT]') === -1) {
                            data[idata].label = '[LT] '+data[idata].label;
                        }
                        vals1.push(val);
                    }
                }
            });
        });
        data[idata].data.push([11, undefined]);
    });

    // find maxs
    vals1.sort(function(a,b) { return a-b; });
    vals2.sort(function(a,b) { return a-b; });
    var top1 = parseInt(vals1[vals1.length-1],10);
    var top2 = parseInt(vals2[vals2.length-1],10);
    var y1max = top1 + (top1*0.1);
    var y2max = top2 + 1;
    var min = 0;

    var f = Flotr.draw($('graph'), data.reverse(), {
        title: 'Threshold Times',
        subtitle: 'Note: Higher values are converted to seconds and shown on the right.',
        HtmlText: false,
        xaxis: {
            noTicks: 12,
            tickFormatter: function (n) {
                n = parseInt(n, 10);
                if (n === 0 || n === 11) {
                    return ' ';
                }
                return '#' + n;
            }
        },
        yaxis: {
            noTicks: 10,
            min: min,
            max: y1max,
            title: 'ms'
        },
        y2axis: {
            noTicks: 10,
            min: min,
            max: y2max,
            title: 'sec'
        },
        mouse: {
            track: true,
            trackFormatter: function(obj) { return obj.y; }
        },
        grid: {
            outlineWidth: 0,
            labelMargin: 6
        },
        legend: {
            position: 'nw'
        }
    });
}

function graphBreakdown() {
    var d1 = [];
    var d2 = [];
    var d3 = [];
    var d4 = [];
    var mv = [];

    var i = 0;
    results.forEach(function (result) {
        var fb  = parseFloat(result.client.timeToFirstByte);
        var dr  = parseFloat(result.client.onDOMReadyTime)-fb;
        var wl  = parseFloat(result.client.windowOnLoadTime)-dr;
        var tc  = parseFloat(result.client.httpTrafficCompleted)-wl;
        var all = fb+dr+wl+tc;

        d1.push([i, fb]);
        d2.push([i, dr]);
        d3.push([i, wl]);
        d4.push([i, tc]);

        mv.push(all);

        i++;
    });

    // Not sure why this is necessary, perhaps a bug in flotr2,
    // perhaps I'm doing something wrong.
    d1.push([i, undefined]);
    d2.push([i, undefined]);
    d3.push([i, undefined]);
    d4.push([i, undefined]);

    mv.sort(function(a,b) { return a-b; });
    var max = mv[mv.length-1] + (mv[mv.length-1]*0.1);

    var data = [
        { data: d1, label: 'first byte' },
        { data: d2, label: 'render time' },
        { data: d3, label: 'dom processing' },
        { data: d4, label: 'page render' }
    ];

    // find maxs

    var f = Flotr.draw($('graph'), data, {
        HtmlText: false,
        title: 'Page Load Stacked',
        subtitle: 'Note: overlaps indicate a processing error.',
        xaxis: { noTicks: 0, min: -0.2 },
        bars: {
            show: true,
            stacked: true,
            horizontal: false,
            barWidth: 0.8,
            lineWidth: 1
        },
        yaxis: {
            noTicks: 10,
            max: max,
            min: 0,
            title: 'ms'
        },
        grid: {
            verticalLines : false,
            outlineWidth: 0,
            horizontalLines : true
        }
    });
}

function graphBreakdownLine() {
    var d1 = [[0,undefined]];
    var d2 = [[0,undefined]];
    var d3 = [[0,undefined]];
    var d4 = [[0,undefined]];

    var max1 = [];
    var max2 = [];

    var i = 1;
    results.forEach(function (result) {
        var c = result.client;

        d1.push([i, parseFloat(c.timeToFirstByte)||undefined]);
        d2.push([i, parseFloat(c.onDOMReadyTime)||undefined]);
        d3.push([i, parseFloat(c.windowOnLoadTime/1000)||undefined]);
        d4.push([i, parseFloat(c.httpTrafficCompleted/1000)||undefined]);

        max1.push(parseFloat(c.onDOMReadyTime));
        max2.push(parseFloat(c.httpTrafficCompleted/1000));
        i++;
    });

    d1.push([11, undefined]);
    d2.push([11, undefined]);
    d3.push([11, undefined]);
    d4.push([11, undefined]);

    max1.sort(function(a,b) { return a-b; });
    max2.sort(function(a,b) { return a-b; });

    var y1max = max1[max1.length-1]+100;
    var y2max = max2[max2.length-1]+1;

    var min = 0;

    var data = [
        { data: d1, lines: {show: true}, points: {show: true}, label: '[LT] timeToFirstByte' },
        { data: d2, lines: {show: true}, points: {show: true}, label: '[LT] onDOMReadyTime' },
        { data: d3, lines: {show: true}, points: {show: true}, yaxis: 2, label: '[RT] windowOnLoadTime' },
        { data: d4, lines: {show: true}, points: {show: true}, yaxis: 2, label: '[RT] httpTrafficCompleted' }
    ];

    var f = Flotr.draw($('graph'), data, {
        title: 'Page Load Times',
        subtitle: 'Note: Values off chat are processing errors.',
        HtmlText: false,
        xaxis: {
            noTicks: 12,
            tickFormatter: function (n) {
                n = parseInt(n, 10);
                if (n === 0 || n === 11) {
                    return ' ';
                }
                return '#' + n;
            }
        },
        yaxis: {
            noTicks: 10,
            min: min,
            max: y1max,
            title: 'ms'
        },
        y2axis: {
            noTicks: 10,
            min: min,
            max: y2max,
            title: 'sec'
        },
        mouse: {
            track: true,
            trackFormatter: function(obj) { return obj.y; }
        },
        grid: {
            outlineWidth: 0,
            labelMargin: 6
        },
        legend: {
            position: 'nw'
        }
    });
}

function graphLastPie() {
    var result = results[results.length-1];

    var lb = parseFloat(result.client.timeToLastByte);
    var dr = parseFloat(result.client.onDOMReadyTime)-lb;
    var tc = parseFloat(result.client.httpTrafficCompleted)-dr;

    var data = [
        { data: [[0, lb]], label: 'Downloading', pie: { explode: 20 } },
        { data: [[0, dr]], label: 'DOM Processing' },
        { data: [[0, tc]], label: 'Page Rendering' }
    ];

    var f = Flotr.draw($('graph'), data, {
        title: 'Last Run',
        HtmlText: false,
        pie: {
            show: true,
            explode: 6
        },
        xaxis: { showLabels: false },
        yaxis: { showLabels: false },
        grid: {
            verticalLines: false,
            horizontalLines: false,
            outlineWidth: 0
        },
        legend: {
            position: 'nw'
        }
    });
}
