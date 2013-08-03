if (typeof results === 'undefined') {
    results = [];
}

if (typeof thresholds === 'undefined') {
    thresholds = {};
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

document.observe('dom:loaded', function(){
    var data = [];
    var vals1 = [];
    var vals2 = [];

    thresholds.forEach(function(key) {
        data.push({label: key, data: [[0,undefined]], lines: {show: true}, points: {show: true}});
        var idata = data.length-1;

        // make yslow keys pretty
        switch (key) {
            case 'o':
                data[idata].label = 'overall';
                break;
            case 'w':
                data[idata].label = 'pageWeight';
                break;
            case 'r':
                data[idata].label = 'httpRequests';
                break;
            case 'lt':
                data[idata].label = 'loadTime';
                break;
        }

        results.forEach(function (result) {
            [ 'server', 'client', 'grader' ].forEach(function(marker) {
                if (Object.keys(result[marker]).indexOf(key) !== -1) {
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
        legend : {
            position : 'sw',
            backgroundColor: 'lightblue'
        }
    });
});
