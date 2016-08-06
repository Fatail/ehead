'use strict';
require("babel-polyfill");

const _ = require("lodash");
const request = require("request-promise");
const cheerio = require("cheerio");
const fs = require('fs');
const download = require('download');
const path = require('path');
const Table = require("cli-table");

const eggHeadApi = `https://egghead.io/api/v1/lessons`;
const makeUrl = (lessonUrl) => {
    if (lessonUrl.length === 0 && !_.isString(lessonUrl) ) throw new Error("Please enter a url using --url param. Type --help.");
    if (lessonUrl.indexOf("https://egghead.io/lessons/") >= 0){
        lessonUrl = lessonUrl.replace("https://egghead.io/lessons/", "");
        let index = lessonUrl.indexOf("?");
        lessonUrl = lessonUrl.slice(0, index > 0? index: lessonUrl.length );
        console.log(lessonUrl);
    }
    if (lessonUrl.slice(-1) === "/") lessonUrl = lessonUrl.slice(-1);
    return `${eggHeadApi}/${lessonUrl}/next_up`;
};

const getWistiaUrl = (page) => {
    let $ = cheerio.load(page);
    let wistiaId = $('.wistia_embed').attr("id").toString().replace("wistia_","");
    return `https://fast.wistia.com/embed/medias/${wistiaId}/metadata.js`;
};

const parseWistiaMetaData = (meta) =>{
    let start = 'var mediaJson = ';
    let end = 'for (var key';

    let jsonMeta = meta.slice(meta.indexOf(start) + start.length, meta.indexOf(end)).replace("}};", "}}");

    try {
        return JSON.parse(jsonMeta);
    } catch (e){
        console.log("Failed to parse json: ", e);
        console.log(jsonMeta);
        return false;
    }
};

const downloadVideo = async (lessonName, videoObject, dest, quality) =>{
    console.log(`Start download: ${(videoObject.size / ( 1024 * 1024 )).toFixed(4)} MB | ${quality} | `);
    try{
        const data = await download(videoObject.url);
        const fileName = `${lessonName}_${videoObject.displayName}.${videoObject.container}`;
        fs.writeFileSync(path.normalize(`${dest}/${fileName}`), data);
        console.log("Downloaded!");
    } catch(e){
        console.log("Failed to download video! Error: ", e);
    }
};

let argv = require('yargs')
    .usage('Usage: $0 [--option] ...')
    .describe('url', 'Url from egghead site with https.')
    .describe('format', 'Format for video default to 720p.')
    .alias('v', 'verbose')
    .alias('u', 'url')
    .alias('f', 'format')
    .alias('q', 'quality')
    .alias('l', 'list')
    .alias('o', 'out')
    .help('h')
    .alias('h', 'help')
    .default('format', 'mp4')
    .default('quality', '720p')
    .default('verbose', false)
    .default('list', false)
    .default('out', './')
    .epilog('@mr47 aka Dmitry Poddubniy 2016')
    .demand(['u'])
    .argv;


const debug = argv.verbose;
const videoFormat = argv.format;
const videoQuality = argv.quality;
const listOutput = argv.list;
const outDir = argv.out;

let url = makeUrl(argv.url);

request(url)
    .then( (data) => JSON.parse(data) )
    .then((course)=>{
        let name = _.result(course, "list.title");
        !listOutput && console.log('Find a course: ', name);
        return course;
    })
    .then((course)=>{
        const lessons = _.result(course, "list.lessons", []);
        const outDirName = _.result(course, "list.title", `unknown_${Math.random().toString().slice(4, 7)}`);

        if (lessons.length === 0) console.log("No lessons found!");

        !listOutput && console.log(`${lessons.length} lessons found!`);

        _.forEach(lessons, async function(lesson){
            try{

                debug && console.log('lesson:info', lesson);

                let page = await request(_.result(lesson, "lesson_http_url"));
                let wistiaUrl = getWistiaUrl(page);
                let jsonMetaRaw = await request(wistiaUrl);
                let jsonMeta = parseWistiaMetaData(jsonMetaRaw);
                let lessonVideoInfo = _.result(jsonMeta, "assets", []);

                debug && console.log( 'video:info', lessonVideoInfo );

                let video = _.find(lessonVideoInfo, { display_name: videoQuality, container: videoFormat });

                if (listOutput) {

                    let formats = _.chain(lessonVideoInfo).groupBy("container").keys().without("undefined").value();
                    let quality = _.chain(lessonVideoInfo).groupBy("display_name").keys().without("undefined", "Image", "Storyboard").value();

                    let table = new Table();

                    table.push(
                        { 'course': outDirName },
                        { 'formats':  formats.join(", ") },
                        { 'quality': quality.join(", ") }
                    );

                    console.log(table.toString());

                    process.exit(0);
                }

                debug && console.log('video:raw', video);
                const outDirResolved = path.resolve(path.normalize(`${outDir}/${outDirName}`));
                const outDirNormalized = path.resolve(path.normalize(outDir));
                debug && console.log("out:dir", outDirResolved);

                if (!fs.existsSync(outDirNormalized)) fs.mkdirSync(outDirNormalized);
                if (!fs.existsSync(outDirResolved)) fs.mkdirSync(outDirResolved);
                downloadVideo(lesson.slug, video, outDirResolved, videoQuality);

            } catch (e){
                console.log("Failed with:", e);
            }
        })

    });