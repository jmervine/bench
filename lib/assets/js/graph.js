if (typeof results === 'undefined') {
    results = [];
}

if (typeof thresholds === 'undefined') {
    thresholds = [];
} else {
    thresholds = Object.keys(thresholds);
}

function formatDate(date) {
    function zeroPad(n, mod) {
        mod = mod || 0;
        return ('0' + (n+mod)).slice(-2);
    }

    date = new Date(date);
    var dateStr;
    var dayCheck = new Date(date);
    if (dayCheck.setHours(0,0,0,0) == new Date().setHours(0,0,0,0)) {
        dateStr = zeroPad(date.getHours()) + ':'
                + zeroPad(date.getMinutes());
    } else {
        dateStr = zeroPad(date.getMonth(), 1) + '/'
                + zeroPad(date.getDate()) + '/'
                + date.getFullYear();
    }
    return dateStr;
}

function expandKey(key) {
    // make yslow keys pretty
    switch (key) {
        case 'o':
            return 'overall';
        case 'w':
            return 'pageWeight';
        case 'r':
            return 'httpRequests';
        case 'lt':
            return 'loadTime';
        default:
            return key;
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
                        if (data[idata].label.indexOf('[y right]') === -1) {
                            data[idata].label = data[idata].label+' [y right]';
                        }
                        vals2.push(val/1000);
                    } else {
                        data[idata].data.push([data[idata].data.length, val]);
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

    var f = Flotr.draw($('graph'), data, {
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
            max: y1max
        },
        y2axis: {
            noTicks: 10,
            min: min,
            max: y2max
        },
        mouse: {
            track: true,
            trackFormatter: function(obj) { return obj.y; }
        },
        grid: {
            backgroundColor: 'white',
            outlineWidth: null,
            labelMargin: 6
        },
        legend: {
            position: 'sw'
        }
    });
}

function graphBreakdown() {
    var d1 = [];
    var d2 = [];
    var d3 = [];
    var d4 = [];
    var d5 = [];
    var d6 = [];
    var maxv = [];

    var i = 0;
    results.forEach(function (result) {
        var s = result.server;
        var c = result.client;

        d1.push([i, parseFloat(s.connection_time_median)]);
        d2.push([i, parseFloat(c.timeToFirstByte)      - parseFloat(s.connection_time_median)]);
        d3.push([i, parseFloat(c.timeToLastByte)       - parseFloat(c.timeToFirstByte)]);
        d4.push([i, parseFloat(c.onDOMReadyTime)       - parseFloat(c.timeToLastByte)]);
        d5.push([i, parseFloat(c.windowOnLoadTime)     - parseFloat(c.onDOMReadyTime)]);
        d6.push([i, parseFloat(c.httpTrafficCompleted) - parseFloat(c.windowOnLoadTime)]);

        maxv.push(
            parseFloat(s.connection_time_median)
            + (parseFloat(c.timeToFirstByte)      - parseFloat(s.connection_time_median))
            + (parseFloat(c.timeToLastByte)       - parseFloat(c.timeToFirstByte))
            + (parseFloat(c.onDOMReadyTime)       - parseFloat(c.timeToLastByte))
            + (parseFloat(c.windowOnLoadTime)     - parseFloat(c.onDOMReadyTime))
            + (parseFloat(c.httpTrafficCompleted) - parseFloat(c.windowOnLoadTime))
        );

        i++;
    });

    maxv.sort(function(a,b) { return a-b; });
    var max = maxv[maxv.length-1] + (maxv[maxv.length-1]*0.1);

    var data = [
        { data: d1, label: 'server response' },
        { data: d2, label: 'first byte' },
        { data: d3, label: 'last byte' },
        { data: d4, label: 'render time' },
        { data: d5, label: 'dom processing' },
        { data: d6, label: 'page render' }
    ];

    // find maxs

    var f = Flotr.draw($('graph'), data, {
        xaxis: {
            noTicks: 0,
            min: -0.2
        },
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
            min: 0
        },
        grid: {
            verticalLines : false,
            horizontalLines : true
        }
    });

    // Reverse Legend Order
    // there's gotta be a better way
    var newLegend = '';
    $$('td.flotr-legend-label')
        .map(function(l) {
            return l.up();
        })
        .reverse()
        .each(function(x) {
            newLegend = newLegend + '<tr>' + x.innerHTML + '</tr>';
        });

    $$('.flotr-legend')[0].down(1).innerHTML=newLegend;

}

