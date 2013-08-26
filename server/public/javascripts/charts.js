var start, xRotation, currentCategory, count = {}, limit = 10, disabled = {};
var yTitle = 'Duration (ms)', chartTitle = 'Results';

$(window).load(function() {
    $.getJSON(apiPath('urls'), function(result) {
        result.forEach(function(url) {
            setPagination();
            $('#urlselect').append($('<option>', { value: url, text: url }));
        });
    });

    $.getJSON(apiPath('keys'), function(result) {
        var keyCount = 0;
        result.forEach(function(key) {
            keyCount++;
            var optionOptions = { value: key, text:key };
            if (key === 'httpTrafficCompleted') {
                optionOptions.selected = 'selected';
            }
            $('#keyselect').append($('<option>', optionOptions));
        });
        $('#keyselect').attr('size', keyCount);
    });

    $('#urlselect').change(function() {
        setPagination();
        draw();
    });

    $('#limitselect').change(function() {
        limit = parseInt($('#limitselect option:selected').val(), 10);
        switch (limit) {
            case 10: xRotation = undefined; break;
            case 25: xRotation = 45; break;
            case 50: xRotation = 60; break;
            default: xRotation = 90;
        }
        draw();
    });

    $('#keyselect').change(function() {
        clearCategories();
        var keys = [];
        chartTitle = 'Results';
        $('#keyselect option:selected').each(function() { keys.push($(this).val()); });
        draw(keys);
    });
});

function apiPath(api, params) {
    params = params || {};
    var path = '/client/'+api+'?';
    var opts = [];
    Object.keys(params).forEach(function(key) {
        opts.push(key+'='+params[key]);
    });
    return path+opts.join('&');
}

function selectedURL() {
    if ($('#urlselect option:selected').index() !== 0) {
        return escape($('#urlselect option:selected').attr('value'));
    }
}

function getCount(callback) {
    callback = callback || function(){};
    if (!selectedURL()) {
        callback(false); return;
    }
    if (count[selectedURL()]) {
        callback(true); return;
    }
    $.getJSON(apiPath('count', {url: selectedURL()}), function(c) {
        count[selectedURL()] = c;
        callback(true); return;
    });
}

var navigation = {
    first: function() {
        start = 0;
    },
    earlier: function() {
        start = (start ? (start - limit) : (count[selectedURL()] - (limit * 2)));
        start = (start < 0 ? 0 : start);
    },
    last: function() {
        start = undefined;
    },
    later: function() {
        start = start + limit;
    },
};

function navigate(name) {
    if (!disabled[name]) {
        navigation[name]();
        draw();
        setPagination();
    }
}

function disable(name) {
    $('li.'+name).addClass('disabled');
    disabled[name] = true;
}

function enable(name) {
    $('li.'+name).removeClass('disabled');
    disabled[name] = false;
}

function setPagination() {
    getCount(function(success) {
        ['first','last','earlier','later'].forEach(function(n) { disable(n); });
        if (success) {
            var c = count[selectedURL()];
            if (typeof start === 'undefined' || (start !== 0 && c > limit)) {
                enable('first');
                enable('earlier');
            }

            if (typeof start !== 'undefined' && (start+limit) < c) {
                enable('last');
                enable('later');
            }
        }
    });
}

var categories = {
    timing: [
        'timeToFirstByte',
        'timeToLastByte',
        'onDOMReadyTime',
        'windowOnLoadTime',
        'httpTrafficCompleted'
    ],
    sizing: [
        'bodySize',
        'htmlSize',
        'cssSize',
        'jsSize',
        'imageSize',
        'headersSize',
        'commentsSize',
        'bodyHTMLSize',
        'hiddenContentSize',
        'whiteSpacesSize',
        'otherSize'
    ],
    requests: [
        'requests',
        'gzipRequests',
        'postRequests',
        'ajaxRequests'
    ],
    counts: [
        'domains',
        'htmlCount',
        'cssCount',
        'jsCount',
        'imageCount',
        'base64Count',
        'smallImages',
        'assetsNotGzipped',
        'cacheHits',
        'cacheMisses',
        'DOMelementsCount',
        'iframesCount',
        'imagesWithoutDimensions',
        'nodesWithInlineCSS',
        'globalVariables',
        'localStorageEntries',
        'documentCookiesCount',
        'domainsWithCookies',
        'otherCount'
    ]
};

var yTitles = {
    timing: 'Duration (ms)',
    sizing: 'Size (bytes)',
    requests: 'Count',
    counts: 'Count'
};

function clearCategories() {
    $('ul.nav li').each(function() { $(this).removeClass('active'); });
}

function clearKeySelect() {
    $('#keyselect option').each(function() { $(this).removeAttr('selected'); });
}

function selectKeySelect(keys) {
    clearKeySelect();
    $('#keyselect option').each(function() {
        if (keys.indexOf($(this).val()) !== -1) {
            $(this).attr('selected', 'selected');
        }
    });
}

function category(cat) {
    clearCategories();
    clearKeySelect();
    if (cat) {
        $('li.'+cat).addClass('active');
        selectKeySelect(categories[cat]);
        currentCategory = cat;
        chartTitle = cat[0].toUpperCase()+cat.slice(1);
        yTitle = yTitles[cat];
    } else {
        currentCategory = undefined;
        chartTitle = 'Results';
        yTitle = yTitles.timing;
    }
    draw();
}

function draw(keys) {
    if (typeof keys === 'undefined' && currentCategory) {
        keys = categories[currentCategory];
    }
    if (typeof keys === 'undefined') {
        keys = ['httpTrafficCompleted'];
    }
    if (selectedURL()) {
        var opts = {url: selectedURL(), limit: limit};
        if (typeof start !== 'undefined') { opts.start = start; }
        $.getJSON(apiPath('data', opts), function(result) {
            graph(result, keys);
        });
    }
}

function formattedDate(obj) {
    var curr = moment();
    var date = moment.unix(obj.created_at/1000);
    if (date.format('YYYY-MM-DD') === curr.format('YYY-MM-DD')) {
        return date.format('HH:mm:ss');
    }
    return date.format('YYYY-MM-DD HH:mm');
}

function graph(data, keys) {
    keys = keys || ['httpTrafficCompleted'];
    var series = [];
    keys.forEach(function(key) {
        series.push(getSeries(data, key));
    });
    $('#highcharts').highcharts({
        title: {
            text: chartTitle,
            x: -20
        },
        subtitle: {
            text: unescape(selectedURL()),
            x: -20
        },
        xAxis: {
            categories: data.map(formattedDate),
            labels: { rotation: xRotation }
        },
        yAxis: {
            title: {
                text: yTitle
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            valueSuffix: 'ms'
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: series
    });
}

function getSeries(data, key) {
    return {
        name: key,
        data: data.map(function(o) { return o.metrics[key]; } )
    };
}

