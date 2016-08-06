'use strict';

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require("babel-polyfill");

var _ = require("lodash");
var request = require("request-promise");
var cheerio = require("cheerio");
var fs = require('fs');
var download = require('download');
var path = require('path');
var eggHeadApi = "https://egghead.io/api/v1/lessons";

var makeUrl = function makeUrl(lessonUrl) {
    if (lessonUrl.indexOf("https://egghead.io/lessons/") >= 0) {
        lessonUrl = lessonUrl.replace("https://egghead.io/lessons/", "");
    }
    if (lessonUrl.slice(-1) === "/") lessonUrl = lessonUrl.slice(-1);
    return eggHeadApi + "/" + lessonUrl + "/next_up";
};

var getWistiaUrl = function getWistiaUrl(page) {
    var $ = cheerio.load(page);
    var wistiaId = $('.wistia_embed').attr("id").toString().replace("wistia_", "");
    return "https://fast.wistia.com/embed/medias/" + wistiaId + "/metadata.js";
};

var parseWistiaMetaData = function parseWistiaMetaData(meta) {
    var start = 'var mediaJson = ';
    var end = 'for (var key';

    var jsonMeta = meta.slice(meta.indexOf(start) + start.length, meta.indexOf(end)).replace("}};", "}}");

    try {
        return JSON.parse(jsonMeta);
    } catch (e) {
        console.log("Failed to parse json: ", e);
        console.log(jsonMeta);
        return false;
    }
};

var downloadVideo = function () {
    var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(lessonName, videoObject, dest, quality) {
        var data, fileName;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        console.log("Start download: " + (videoObject.size / (1024 * 1024)).toFixed(4) + " MB | " + quality + " | ");
                        _context.prev = 1;
                        _context.next = 4;
                        return download(videoObject.url);

                    case 4:
                        data = _context.sent;
                        fileName = lessonName + "_" + videoObject.displayName + "." + videoObject.container;

                        fs.writeFileSync(path.normalize(dest + "/" + fileName), data);
                        console.log("Downloaded!");
                        _context.next = 13;
                        break;

                    case 10:
                        _context.prev = 10;
                        _context.t0 = _context["catch"](1);

                        console.log("Failed to download video! Error: ", _context.t0);

                    case 13:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[1, 10]]);
    }));

    return function downloadVideo(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
}();

//javascript-mobx-and-react-intro-syncing-the-ui-with-the-app-state-using-observable-and-observer

var argv = require('yargs').usage('Usage: $0 [--option] ...').describe('url', 'Url from egghead site with https.').alias('d', 'dump').alias('u', 'url').help('h').alias('h', 'help').epilog('@mr47 aka Dmitry Poddubniy 2016').argv;

var debug = argv.dump;

var url = makeUrl(argv.url);

request(url).then(function (data) {
    return JSON.parse(data);
}).then(function (course) {
    var name = _.result(course, "list.title");
    console.log('Find a course: ', name);
    return course;
}).then(function (course) {
    return _.result(course, "list.lessons", []);
}).then(function (lessons) {
    if (lessons.length === 0) console.log("No lessons found!");
    console.log(lessons.length + " lessons found!");
    _.forEach(lessons, function () {
        var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(lesson) {
            var page, wistiaUrl, jsonMetaRaw, jsonMeta, lessonVideoInfo, video;
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:

                            debug && console.log(lesson);

                            _context2.next = 3;
                            return request(_.result(lesson, "lesson_http_url"));

                        case 3:
                            page = _context2.sent;
                            wistiaUrl = getWistiaUrl(page);
                            _context2.next = 7;
                            return request(wistiaUrl);

                        case 7:
                            jsonMetaRaw = _context2.sent;
                            jsonMeta = parseWistiaMetaData(jsonMetaRaw);
                            lessonVideoInfo = _.result(jsonMeta, "assets", []);

                            // debug && console.log( lessonVideoInfo );

                            video = _.find(lessonVideoInfo, { display_name: "720p", container: "mp4" });

                            // debug && console.log(video);

                            if (!fs.existsSync("./output")) fs.mkdirSync("./output", "0755");
                            downloadVideo(lesson.slug, video, "./output", "720p");

                        case 13:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));

        return function (_x5) {
            return _ref2.apply(this, arguments);
        };
    }());
});