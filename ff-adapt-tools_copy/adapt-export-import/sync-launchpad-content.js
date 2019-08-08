#!/usr/bin/env node
/**
 * sync-launchpad-content.js
 *
 * Download all shared courses into a launchpad public folder
 */

const fs = require('fs');
const r = require('request-promise');
const request = require('request');
const _ = require('lodash');
const StreamZip = require('node-stream-zip');

const filterR = /^T[0-9]+_.*/;

const main = async function () {
    const argv = require('yargs')
        .usage('Usage: $0 --toolUrl [url to adapt] --username [user for adapt] --password [password for adapt] --directory [launchpad public folder]')
        .default('toolUrl', 'http://localhost:5000')
        .describe('toolUrl', 'URL to the Adapt authoring instance')
        .describe('directory', 'Directory containing the courses structure')
        .describe('username', 'Username for adapt')
        .describe('password', 'Password for adapt')
        .demandOption(['directory', 'username', 'password'])
        .argv;

    const cookies = r.jar();

    const loginOptions = {
        method: 'POST',
        uri: `${argv.toolUrl}/api/login`,
        form: {
            email: argv.username,
            password: argv.password
        },
        resolveWithFullResponse: true,
        jar: cookies
    };

    console.log(`Logging into authoring tool ${argv.toolUrl}`);

    const loginResponse = await (r(loginOptions));

    if (loginResponse.statusCode !== 200) {
        throw(`Unable to log into authoring tool with error ${loginResponse.statusCode}`);
    }

    console.log(`Logged into authoring tool ${argv.toolUrl}`);

    // First off, we have to find all the courses...
    // TODO(Viv): This gets only the first 250 packages. Would need to paginate to make sure we get all the courses.
    const queryOptions = {
        method: 'GET',
        uri: `${argv.toolUrl}/api/shared/course?search[title]=.*.*&operators[skip]=0&operators[limit]=250&operators[sort][title]=1`,
        jar: cookies,
        json: true
    };

    const courseArray = await (r(queryOptions));

    for (const course of courseArray) {
        await (async (course) => {

        const check = course.title.match(filterR);

        if (!check) return;

        console.log(`Processing ${course.title}`);

        // "Update" the theme, this will also trigger the rebuild flag
        // /api/theme/:themeid/makeitso/:courseid
        const contentOptions = {
            method: 'GET',
            uri: `${argv.toolUrl}/api/content/config/${course['_id']}`,
            jar: cookies,
            json: true
        };
        const contentObject = await (r(contentOptions));

        if (contentObject['_theme']) {
            // This, weirdly, is a name - perhaps to deal with versioning? Anyway,
            // lookup all the themes - they come back as an array
            const themeOptions = {
                method: 'GET',
                uri: `${argv.toolUrl}/api/themetype`,
                jar: cookies,
                json: true
            };

            const themes = await (r(themeOptions));

            const themeName = 'ff-adapt-theme2';

            const theme = _.find(themes, {
                'name': themeName //contentObject['_theme']
            });

            if (!theme) {
                throw "Theme not found!"
            }

            // Now set-it again to trigger the rebuild
            const reThemeOptions = {
                method: 'POST',
                uri: `${argv.toolUrl}/api/theme/${theme['_id']}/makeitso/${course['_id']}`,
                jar: cookies,
                json: true
            };

            console.log(`Setting theme ${theme['_id']} for ${course.title}`);

            const reTheme = await r(reThemeOptions);

            if (!(reTheme.success === true)) {
                console.log("Failed to trigger rebuild");
            }
        }

        // api/output/adapt/publish/5ae349b4f438fb272c68b89c
        // No other parameters are used (e.g. there isn't a force rebuild thing)

        const packageGetOptions = {
            method: 'GET',
            uri: `${argv.toolUrl}/api/output/adapt/publish/${course['_id']}`,
            jar: cookies,
            json: true
        };

        // Body contains:
        // {"success":true,"payload":{"success":true,"filename":"C:\\src\\3rdparty\\adapt_authoring\\temp\\5aa69e398b0271e5839f68f7\\adapt_framework\\courses\\5aa69e398b0271e5839f68f7\\5ae349b4f438fb272c68b89c\\download.zip","zipName":"fwm-questions"}}

        console.log(`Packaging ${course.title}`);

        const packageObject = await r(packageGetOptions);

        if (packageObject.success !== true || packageObject.payload.success !== true) {
            console.log(`Unable to publish course ${course.title}`);
            return;
        }

        // Find the output folder based on the zip name
        var zipNameRegularExpression = /^(([a-z]{2})_)?t([0-9]{1,2})_l([0-9]{1})_.*$/i;
        var match = zipNameRegularExpression.exec(packageObject.payload.zipName);
        if (!match) {
            throw(`Unable to parse ZIP file name ${packageObject.payload.zipName}`);
        }

        var locale = match[2] || "en";
        var topicId = match[3];
        var lessonId = match[4];

        var topicsFolder = `${argv.directory}/${locale}/t/`;

        if (!fs.existsSync(topicsFolder)) {
            console.log(`Cannot find topics folder '${topicsFolder}' for course '${packageObject.payload.zipName}', skipping.`);
            return;
        }

        var topicsFolder = `${argv.directory}/${locale}/t/`;
        var topicFolder = null;
        fs.readdirSync(topicsFolder).forEach(file => {
            if (new RegExp(`^${topicId}-`).exec(file)) {
                topicFolder = `${topicsFolder}/${file}/`;
            }
        });
        if (!topicFolder) {
            console.log(`Cannot find topic folder for course '${packageObject.payload.zipName}', skipping.`);
            return;
        }

        var lessonsFolder = `${topicFolder}l/`;
        if (!fs.existsSync(lessonsFolder)) {
            console.log(`Cannot find lessons folder '${lessonsFolder}' for course '${packageObject.payload.zipName}', skipping.`);
            return;
        }

        var lessonFolder = null;
        fs.readdirSync(lessonsFolder).forEach(file => {
            if (new RegExp(`^${lessonId}-`).exec(file)) {
                lessonFolder = `${lessonsFolder}/${file}/`;
            }
        });
        if (!lessonFolder) {
            console.log(`Cannot find lesson folder for course '${packageObject.payload.zipName}', skipping.`);
            return;
        }
        console.log(`Lesson folder for course ${packageObject.payload.zipName} found: ${lessonFolder}`);

        // packageObject contains a payload which includes a local (to the server) path to the zip,
        // and also a zipName which we need to use along with the course id to construct the download
        // request
        // Download download/5aa69e398b0271e5839f68f7/5ae349b4f438fb272c68b89c/fwm-questions/download.zip?

        const downloadRequest = `download/${course['_tenantId']}/${course['_id']}/${packageObject.payload.zipName}/download.zip?`;

        const downloadFile = `${lessonFolder}/${packageObject.payload.zipName}.zip`;

        const downloadOptions = {
            method: 'GET',
            uri: `${argv.toolUrl}/${downloadRequest}`,
            jar: cookies,
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        };

        await (new Promise(function (resolve, reject) {
            request(downloadOptions)
                .pipe(fs.createWriteStream(downloadFile))
                .on('close', function () {
                    resolve();
                })
                .on('error', function (e) {
                    reject(e);
                });
        }));

        console.log(`Retrieved zip ${downloadFile} into '${downloadFile}'`);

        await (new Promise(function (resolve, reject) {
            var zip = new StreamZip({
                file: downloadFile,
                storeEntries: true
            });
            zip.on('ready', function () {
                zip.extract(null, lessonFolder, (err, count) => {
                    zip.close();

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }));

        fs.unlinkSync(downloadFile);

        console.log(`Extraction complete`);
    })(course)}
};


main().then(function () {
    console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});
