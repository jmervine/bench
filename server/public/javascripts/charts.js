// helpers
var database;
var template = {
    chart: { type: 'line' },
    title: { text: 'Page Timings' },
    legend: {
        align: 'right',
        verticalAlign: 'top',
        layout: 'vertical',
        x: -10,
        y: 30,
        borderWidth: 0
    },
    tooltip: {
        shared: true,
        useHTML: true,
        headerFormat: '<table>',
        pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' +
        '<td style="text-align: right"><b>{point.y}</b></td></tr>',
        footerFormat: '</table>'
    },
    scrollbar: { enabled: false },
    xAxis: {
        min: 0,
        labels: {
            formatter: xFormatter,
            rotation: 60
        }
    },
    yAxis: {
        allowDecimals: true,
        title: {
            text: 'Time in ms'
        },
        tickInterval: 500
    },
    exporting: {
        enabled: true
    }
};

switch(top.location.href.split('#')[1]) {
    case 'column':
        template.chart.type = 'column';
        break;
    default:
        template.chart.type = 'line';
}

function updateTemplate(cat) {
    switch (cat) {
        case 'sizing':
            template.yAxis.title.text = 'Size in bytes';
            template.yAxis.tickInterval = 100000;
            template.title.text = 'Content Sizing';
            break;
        case 'requests':
            template.yAxis.title.text = 'Requests';
            template.yAxis.tickInterval = 10;
            template.title.text = 'HTTP Requests';
            break;
        case 'counts':
            template.yAxis.title.text = 'Counts';
            template.yAxis.tickInterval = 25;
            template.title.text = 'Misc. Counts';
            break;
        default: /* timing */
            template.yAxis.title.text = 'Time in ms';
            template.title.text = 'Page Timings';
            template.yAxis.tickInterval = 500;
    }
}

var keys = {
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

function fetchData(callback) {
    if (typeof database === 'undefined') {
        $.getJSON('/database.json', function(data) {
            database = data;
            callback(database);
        });
    } else {
        callback(database);
    }
}

function parseResult(data, keys, type) {
    var results = [];

    keys.forEach(function(key) {
        var d = [];
        data.forEach(function(entry) {
            d.push(entry.metrics[key]);
        });
        results.push({ name: key, data: d });
    });

    return results;
}

function parseDate(data, type) {
    var dates = [];
    data.forEach(function(entry) {
        dates.push(entry.created_at);
    });

    return dates;
}

function xFormatter() {
    return moment(this.value).fromNow();
}

function yFormatter() {
    return this.value/1000;
}

function setActiveNav(type) {
    switch (type) {
        case 'column':
            $('li.line').removeClass('active');
            $('li.column').addClass('active');
            break;
        default:
            $('li.column').removeClass('active');
            $('li.line').addClass('active');
            break;
    }
}

function ensureSideLinks() {
    $('ul.nav.nav-list a').each(function() { $(this).attr("href", "#"+template.chart.type); });
}

function draw(type) {
    template.chart.type = type || template.chart.type;
    fetchData(function (data) {
        if (template.chart.type === 'column') {
            template.xAxis.max = (data.length >= 5 ? 4 : data.length-1);
        } else {
            template.xAxis.max = (data.length >= 10 ? 9 : data.length-1);
        }
        template.scrollbar.enabled = (data.length-1 > template.xAxis.max);
        template.xAxis.categories = parseDate(data, template.chart.type);
        template.series = parseResult(data, keys.active, template.chart.type);
        setActiveNav(template.chart.type);
        ensureSideLinks();
        $('#highcharts').highcharts(template);
    });
}

function update(child) {
    var key = $(child).parent().attr('class').split(' ')[0];
    toggleActive(key);
    updateTemplate(key);
    keys.active = keys[key];
    draw();
}

function toggleActive(key) {
    $('ul.nav.nav-list li').each(function() {
        if ($(this).hasClass(key)) {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
            }
        } else {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
            }
        }

    });
}

$(window).load(function () {
    update($('li.timing a'));
});
