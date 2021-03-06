var start, xRotation, keys
  , count = {}
  , limit = 10
  , disabled = {}
  , yTitle = 'Duration (ms)'
  , chartTitle = 'Results'
  , cookieOptions = { expires: 365 };

function limitRotation() {
    xRotation = 45;
    if (limit === 50) {
        xRotation = 60;
    }
}

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
    }
}

function disable(name) {
    $('li.'+name).addClass('disabled');
    disabled[name.replace('-sm','').replace('-lg','')] = true;
}

function enable(name) {
    $('li.'+name).removeClass('disabled');
    disabled[name.replace('-sm','').replace('-lg','')] = false;
}

function setPagination(callback) {
    getCount(function(success) {
        ['first-sm','last-sm','earlier-sm','later-sm','first-lg','last-lg','earlier-lg','later-lg'].forEach(function(n) { disable(n); });
        if (success) {
            var c = count[selectedURL()];
            if (typeof start === 'undefined') {
                start = (c > limit ? undefined : 0);
            }
            if (start !== 0 && c > limit) {
                enable('first-sm');
                enable('first-lg');
                enable('earlier-sm');
                enable('earlier-lg');
            }

            if ((start+limit) < c) {
                enable('last-sm');
                enable('last-lg');
                enable('later-sm');
                enable('later-lg');
            }
        }
        callback();
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
        'htmlSize',
        'cssSize',
        'jsSize',
        'imageSize',
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

function category(cat, skipDraw) {
    clearCategories();
    clearKeySelect();
    if (cat) {
        $('li.'+cat).addClass('active');
        keys = categories[cat];
        selectKeySelect(categories[cat]);
        chartTitle = cat[0].toUpperCase()+cat.slice(1);
        yTitle = yTitles[cat];
    } else {
        chartTitle = 'Results';
        yTitle = yTitles.timing;
    }
    if (!skipDraw) { draw(); }
}

function draw() {
    setPagination(function () {
      if (selectedURL()) {
          //var opts = {url: selectedURL(), limit: limit, start: start};
          //if (typeof start !== 'undefined') { opts.start = start; }
          $.getJSON(apiPath('data', {url: selectedURL(), limit: limit, start: start}), function(result) {
              graph(result, keys);
          });
      }
    });
}

function formattedDate(obj) {
    var curr = moment();
    var date = moment.unix(obj.created_at/1000);
    if (date.format('YYYY-MM-DD') === curr.format('YYYY-MM-DD')) {
        return date.format('HH:mm');
    }
    return date.format('MM-DD HH:mm');
}

function graph(data, keys) {
    keys = keys || ['httpTrafficCompleted'];
    var series = [];
    keys.forEach(function(key) {
        series.push(getSeries(data, key));
    });
    $('#highcharts').highcharts({
        chart: {
            type: (data.length <= 5 ? 'column' : 'line')
        },
        title: {
            text: chartTitle,
            x: -20
        },
        subtitle: {
            text: '<a target="_blank" href="'+unescape(selectedURL())+'">'+unescape(selectedURL())+'</a>',
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
        legend: {
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

function resizeKeyselect() {
    if ($(window).width() < 785 && $('#keyselect').attr('size') !== '4') {
        $('#keyselect').attr('size', '4');
    }
    if ($(window).width() > 785 && $('#keyselect').attr('size') !== '28') {
        $('#keyselect').attr('size', '28');
    }
}

$(window).resize(function() {
    resizeKeyselect();
});

$(window).load(function() {
    resizeKeyselect();
    category('timing', true);
    $.getJSON(apiPath('urls'), function(result) {
        result.forEach(function(url) {
            $('#urlselect').append($('<option>', { value: url, text: url }));

            if ($.cookie('selected_limit') !== 'undefined') {
                $('#limitselect option').each(function() {
                    if ($(this).attr('value') === $.cookie('selected_limit')) {
                        $(this).attr('selected', 'selected');
                        limit = parseInt($('#limitselect option:selected').val(), 10);
                        limitRotation();
                    }
                });
            }
            if ($.cookie('selected_url') !== 'undefined') {
                $('#urlselect option').each(function() {
                    if ($(this).attr('value') === $.cookie('selected_url')) {
                        $(this).attr('selected', 'selected');
                        draw();
                    }
                });
            }
        });
        if (results.length === 1) {
            $('#urlselect :nth-child(2)').prop('selected', true);
            $('#urlselect').change();
        }
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
    });

    $('#urlselect').change(function() {
        $.cookie('selected_url', $('#urlselect option:selected').val(), cookieOptions);
        start = undefined;
        draw();
    });

    $('#limitselect').change(function() {
        limit = parseInt($('#limitselect option:selected').val(), 10);
        $.cookie('selected_limit', limit, cookieOptions);
        limitRotation();
        draw();
    });

    $('#keyselect').change(function() {
        clearCategories();
        keys = [];
        chartTitle = 'Results';
        yTitle = '';
        $('#keyselect option:selected').each(function() { keys.push($(this).val()); });
        draw();
    });
});

