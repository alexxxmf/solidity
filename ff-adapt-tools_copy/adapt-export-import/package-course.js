#!/usr/bin/env node
/**
 * package-course.js
 *
 * Download a packaged course from an authoring instance
 */

const fs = require('fs');
const r = require('request-promise');
const request = require('request');
const _ = require('lodash');
const AWS = require('aws-sdk');
const unzip = require('unzip-stream');
const stream = require('stream');
const mime = require('mime-types');
const opn = require('opn');
const rurl = require( 'reachable-urls');
const chalk = require( 'chalk');

require ("@core-es/math-extensions/clamp/polyfill");

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

const cloudFront = "content.freeformers.com";

// The hrefs are escaped in the JSON...
const hrefScannerEscapedGlobal = /<a\s+(?:[^>]*?\s+)?href=(\\["'])(.*?)\1/g;
const hrefScannerEscaped = /<a\s+(?:[^>]*?\s+)?href=(\\["'])(.*?)\1/;

class Processor extends stream.Transform {
    constructor(options) {
        super(options);
        this.filePath = options.filePath;
        this.contents = "";
        this.encodingFound = "";
        this.process = this.filePath.includes('.json');
        this.injectCss = options.injectCss;
        this.customIntro = options.customIntro;
        this.customOutro = options.customOutro;
        this.customReadingItems = options.customReadingItems;
        this.keyTakeAway = options.keyTakeAway;
        this.callToAction = options.callToAction;
    }

    _transform(data, encoding, callback) {
        if (this.process) {
            // This is inherently going to call toString, so explicitly track that's what
            // we've done (otherwise the push later on is confused)
            if (encoding === "buffer") {
                this.contents += data.toString('utf8');
                this.encodingFound = 'utf8';
            }
            else
            {
                this.contents += data;
                this.encodingFound = encoding;
            }
            callback(null,null);
        }
        else {
            callback(null, data, encoding);
        }
    }

    _flush(callback) {
        if (this.process) {
            console.log(`Processing ${this.filePath}`);

            // Check for hrefs
            const anchors = this.contents.match(hrefScannerEscapedGlobal);
            if (anchors) {
                anchors.forEach( anchor => {
                    const href = anchor.match(hrefScannerEscaped);
                    const url = href[2];
                    console.log(`${this.filePath} : ${url}`);
                    rurl(url).then(result => {
                        console.log(result);
                    })
                })
            }

            if (this.contents.includes('&nbsp;')) {

                console.log(chalk.red(`${this.filePath} &nbsp; detected:`));

                let searchIndex = -1;

                while ((searchIndex = this.contents.indexOf('&nbsp;', searchIndex + 1)) !== -1) {
                    console.log("      " + this.contents.substring(Math.clamp(searchIndex - 30, 0, searchIndex), Math.clamp(searchIndex + 36, searchIndex, this.contents.length)));
                }
            }

            let response = this.contents;

            if (this.filePath.includes('components.json') && (this.customIntro || this.customOutro)) {

                let components = JSON.parse(this.contents);

                if (this.customIntro) {
                    console.log("Substituting customIntro");
                    let intro = _.find(components, {title : 'CUSTOMINTRO'});
                    intro.body = this.customIntro;
                }

                if (this.customOutro) {
                    console.log("Substituting customOutro");
                    let outro = _.find(components, {title : 'CUSTOMOUTRO'});
                    outro.body = this.customOutro;
                }

                response = JSON.stringify(components);

            }

            this.push(response, this.encodingFound);

            callback();

        }

        if (this.filePath.includes('adapt.css') && this.injectCss) {
            console.log(`Injecting CSS into ${this.filePath}`);
            callback(null, ".component-instruction{display:none}");
        }

        callback();
    }
}

/**
 * @typedef Arguments
 * @type {object}
 * @property {string} toolUrl - URL to the Adapt authoring instance
 * @property {string} courseName - Course to package
 * @property {string} bucket - S3 bucket to target
 * @property {string} distribution - Cloudfront distribution to invalidate
 * @property {string} directory - Directory for the assets
 * @property {string} theme - Theme to set on the course before packaging
 * @property {string} customIntro - Text to add to a CUSTOMINTRO block (verbatim - can be HTML)
 * @property {string} customOutro - Text to add to a CUSTOMOUTRO block (verbatim - can be HTML)
 * @property {string} customReadingList - Text to add to a CUSTOMREADINGLIST block (verbatim - can be HTML)
 * @property {string} keyTakeAway - Text to add to a KEYTAKEAWAY block (verbatim - can be HTML)
 * @property {string} callToAction - Text to add to a CALLTOACTION block (verbatim - can be HTML)
 * @property {boolean} preview - Display a preview in the local browser after upload
 * @property {boolean} injectCss - Injects CSS to hide the instruction content
 * @property {string} username - Username for adapt
 * @property {string} password - Password for adapt
 */

/**
 * @returns {Promise<void>}
 */
const packageCourse = async function () {

    /**
     * @type {Arguments}
     */
    const argv = require('yargs')
        .usage('Usage: $0 --courseName [course to package] --toolUrl [url to adapt] --username [user for adapt] --password [password for adapt] --directory [output location] --bucket [S3 Bucket] --theme [theme name] -preview')
        .default('toolUrl', 'http://localhost:5000')
        .describe('toolUrl', 'URL to the Adapt authoring instance')
        .default('directory','./packages/')
        .describe('courseName', 'Course to package')
        .describe('directory', 'Directory for the packages')
        .describe('bucket', 'S3 Bucket - in this case Directory also used into S3, and the package is unzipped')
        .describe('distribution', 'Cloudfront Distribution to invalidate')
        .describe('theme', 'Theme to set as part of the build')
        .describe( 'customIntro', 'Text to add to a CUSTOMINTRO block (verbatim - can be HTML)')
        .describe( 'customOutro', 'Text to add to a CUSTOMOUTRO block (verbatim - can be HTML)')
        .describe( 'customReadingList', 'Text to add to a CUSTOMREADINGLIST block (verbatim - can be HTML)')
        .describe( 'keyTakeAway', 'Text to add to a KEYTAKEAWAY block (verbatim - can be HTML)')
        .describe( 'callToAction', 'Text to add to a CALLTOACTION block (verbatim - can be HTML)')
        .boolean('preview')
        .default({ 'preview': false })
        .boolean('injectCss')
        .default({ 'injectCss': false })
        .describe('username', 'Username for adapt')
        .describe('password', 'Password for adapt')
        .demandOption(['courseName', 'username', 'password'])
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

    const loginResponse = await ( r(loginOptions) );

    if (loginResponse.statusCode !== 200) {
        throw(`Unable to log into authoring tool with error ${loginResponse.statusCode}`);
    }

    console.log(`Logged into authoring tool ${argv.toolUrl}`);

    // First off, we have to find the course...

    // api/my/course?search%5Btitle%5D=.*.*&operators%5Bskip%5D=0&operators%5Blimit%5D=1&operators%5Bsort%5D%5Btitle%5D=1

    // Deal with brackets
    let encodedName = argv.courseName;
    encodedName = encodedName.replace("(", "\\(");
    encodedName = encodedName.replace(")", "\\)");
    encodedName = encodeURIComponent(encodedName);

    const queryOptions = {
        method: 'GET',
        uri: `${argv.toolUrl}/api/shared/course?search%5Btitle%5D=${encodedName}&operators%5Bskip%5D=0&operators%5Blimit%5D=1&operators%5Bsort%5D%5Btitle%5D=1`,
        jar: cookies,
        json: true
    };

    const courseArray = await ( r(queryOptions) );

    // Response is an array of objects, each of which have (amongst others), an _id and title

    if (courseArray.length === 0 || courseArray[0].title !== argv.courseName) {
        throw(`Course ${argv.courseName} not found.`)
    }

    // "Update" the theme, this will also trigger the rebuild flag
    // /api/theme/:themeid/makeitso/:courseid

    const contentOptions = {
        method: 'GET',
        uri: `${argv.toolUrl}/api/content/config/${courseArray[0]['_id']}`,
        jar: cookies,
        json: true
    };

    const contentObject = await ( r(contentOptions) );

    if (contentObject['_theme'] || (argv.theme && argv.theme.length > 0)) {
        // This, weirdly, is a name - perhaps to deal with versioning? Anyway,
        // lookup all the themes - they come back as an array

        const themeOptions = {
            method: 'GET',
            uri: `${argv.toolUrl}/api/themetype`,
            jar: cookies,
            json: true
        };

        const themes = await ( r(themeOptions) );

        const themeName = (argv.theme && argv.theme.length > 0) ? argv.theme : contentObject['_theme'];

        console.log(`Looking up ${themeName}`);

        const theme = _.find(themes, {
            'name': themeName
        });

        if (!theme) {
            console.log("Unable to find theme!");
            return;
        }

        // Now set-it again to trigger the rebuild

        const reThemeOptions = {
            method: 'POST',
            uri: `${argv.toolUrl}/api/theme/${theme['_id']}/makeitso/${courseArray[0]['_id']}`,
            jar: cookies,
            json: true
        };

        const reTheme = await( r(reThemeOptions) );

        if (!(reTheme.success === true))
        {
            console.log("Failed to trigger rebuild");
        }
    }

    // api/output/adapt/publish/5ae349b4f438fb272c68b89c
    // No other parameters are used (e.g. there isn't a force rebuild thing)

    const packageGetOptions = {
        method: 'GET',
        uri: `${argv.toolUrl}/api/output/adapt/publish/${courseArray[0]['_id']}`,
        jar: cookies,
        json: true
    };

    // Body contains:
    // {"success":true,"payload":{"success":true,"filename":"C:\\src\\3rdparty\\adapt_authoring\\temp\\5aa69e398b0271e5839f68f7\\adapt_framework\\courses\\5aa69e398b0271e5839f68f7\\5ae349b4f438fb272c68b89c\\download.zip","zipName":"fwm-questions"}}

    /**
     * @typedef PackageObject
     * @type {object}
     * @property {boolean} success
     * @property {object} payload
     * @property {boolean} payload.success
     * @property {string} payload.filename
     * @property {string} payload.zipName
     */

    /**
     * @type {PackageObject}
     */
    const packageObject = await ( r(packageGetOptions) );

    if (packageObject.success !== true || packageObject.payload.success !== true) {
        throw(`Unable to publish course ${argv.courseName}`);
    }

    // packageObject contains a payload which includes a local (to the server) path to the zip,
    // and also a zipName which we need to use along with the course id to construct the download
    // request
    // Download download/5aa69e398b0271e5839f68f7/5ae349b4f438fb272c68b89c/fwm-questions/download.zip?

    const downloadRequest = `download/${courseArray[0]['_tenantId']}/${courseArray[0]['_id']}/${packageObject.payload.zipName}/download.zip?`;

    const downloadOptions = {
        method: 'GET',
        uri: `${argv.toolUrl}/${downloadRequest}`,
        jar: cookies,
        headers: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
        }
    };

    const bucket = argv.bucket;

    // Perhaps parameterise this....?
    const s3 = new AWS.S3({region: 'eu-west-2' /*, logger: console */});

    if (bucket && bucket.length > 0) {
        // Stream the zipfile through unzip, which in turn
        // will stream the streams to S3 at the specified
        // directory

        const path = argv.directory;

        let promises = [];

        await (new Promise(function (resolve, reject) {
            request(downloadOptions)
                .pipe(unzip.Parse())
                .pipe(new stream.Transform({
                    objectMode: true,
                    transform: function(entry, e, cb) {
                        const filePath = path + '/' + entry.path;
                        if (entry.type === 'File') {
                            const pass = new stream.PassThrough();
                            const s3promise = s3.upload({
                                Bucket: bucket,
                                Key: filePath,
                                Body: pass,
                                ContentType: mime.lookup(filePath) || 'application/octet-stream' }).promise();

                            promises.push(s3promise);

                            //console.log(`Streaming to bucket ${bucket} with path ${filePath}`);

                            entry.pipe(new Processor({
                                filePath: filePath,
                                injectCss: argv.injectCss,
                                customIntro: argv.customIntro,
                                customOutro: argv.customOutro,
                                customReadingItems : argv.customReadingItems,
                                keyTakeAway : argv.keyTakeAway,
                                callToAction : argv.callToAction
                            })).pipe(pass)
                                .on('finish', cb)
                                .on('error', function (error) {
                                    e(error);
                                });

                        } else {
                            entry.autodrain();
                            cb();
                        }
                    }
                }))
                .on('finish', function () {
                    resolve();
                })
                .on('error', function (e) {
                    reject(e);
                });
        }).catch(function(e) {
            console.log(e);
        }));

        console.log("Waiting for S3 uploads to complete");

        await (Promise.all(promises));

        console.log("S3 Upload complete");

        const distribution = argv.distribution;

        if (distribution && distribution.length > 0) {
            // We now need to invalidate the cloudfront cache
            // We can have 1000 invalidations a month free. But we can't
            // have more than 10 outstanding at once, so on a batch upload,
            // don't do this per course, but at the end of the upload.

            const targetPath = `/${path}/*`;

            console.log(`Submitting invalidation against ${distribution} at path ${targetPath}`);

            const cloudfront = new AWS.CloudFront();

            const invalidationParams = {
                DistributionId: distribution,
                InvalidationBatch: {
                    CallerReference: new Date().toISOString(),
                    Paths: {
                        Quantity: 1,
                        Items: [
                            targetPath
                        ]
                    }
                }
            };

            const invalidationDetails = await cloudfront.createInvalidation(invalidationParams).promise();

            console.log("Invalidation submitted");

            let status = "";
            let count = 90; // With 5 second counts, this is 7.5 minutes

            do {
                // Lazy poll - this could take minutes.

                await sleep(5000);
                count = count - 1;

                const queryParams = {
                    DistributionId: distribution,
                    Id: invalidationDetails.Invalidation.Id
                };

                const invalidationState = await cloudfront.getInvalidation(queryParams).promise();

                status = invalidationState.Invalidation.Status;

                process.stdout.write("Status: " + status + "    \r");

            } while (status !== "Completed" && count !== 0);

            console.log("");
            if (count === 0) {
                console.log("Failed to invalidate - timed out");
            }
        }

        // Spin out a browser pointing to the S3 upload
        if (argv.preview) {
            const theUrl = `https://${cloudFront}/${path}/index.html`;

            console.log("Opening " + theUrl);

            await (opn(theUrl));
        }
    }
    else {
        // Download the zip file locally

        const downloadFile = `${argv.directory}/${packageObject.payload.zipName}.zip`;

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

        console.log(`Retrieved zip ${downloadFile}`);
    }
};


packageCourse().then(function () {
    console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});
