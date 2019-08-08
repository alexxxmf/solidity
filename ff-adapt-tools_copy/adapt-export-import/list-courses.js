#!/usr/bin/env node
/**
 * list-courses.js
 *
 * List courses contained in an Adapt authoring instance
 */

const r = require('request-promise');
const _ = require('lodash');
const AWS = require('aws-sdk');
const fs = require('fs');
const yargs = require('yargs');
const os = require('os');

// Use execSync to make sure we use a shell
const execSync = require('child_process').execSync;

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function validateCoursesContentId(courses) {
    const collectedIds = [];
    const duplicatedIds = [];
    courses.forEach(course => {
        if ( collectedIds.includes(course.contentId) ) {
            duplicatedIds.push(course.contentId)
        } else {
            collectedIds.push(course.contentId)
        }
    })

    if (duplicatedIds.length) {
        throw(
            `The following contentIds are duplicated in the config file ${duplicatedIds}`
        )
    }
}

function validateRightGrouping(groups, sessions) {
    const collectedIdsFromGroup = []

    if (groups.length < 2) {
        throw(
            `Sessions should be assigned to more than one group. If you want to disable groups, remove groups from JSON`
        );
    }

    const duplicatedIds = []

    groups.forEach((group) => {
        if (!group.sessionIds.length) {
            throw(`Following group has no sessions assigned: ${group.title}`);
        }

        return group.sessionIds.forEach(sessionId => {
            if(collectedIdsFromGroup.includes(sessionId)){
                duplicatedIds.push(sessionId);
            }
            collectedIdsFromGroup.push(sessionId)
        })
    });

    if (duplicatedIds.length) {
        throw(`Following IDs are duplicated in groups: ${duplicatedIds}`);
    }

    const missingIds = []
    
    const sessionIds = []

    sessions.forEach((session) => {
        
        sessionIds.push(session.contentId);
        if (!collectedIdsFromGroup.includes(session.contentId)) {
            missingIds.push(session.contentId)
        }
    })

    const idsDontExistInSessionData = []

    collectedIdsFromGroup.forEach(id => {
        
        if (!sessionIds.includes(id)) {
            idsDontExistInSessionData.push(id)
        }
    })

    if (idsDontExistInSessionData.length) {
        throw(`Following IDs refered in groups don't exist in session data: ${idsDontExistInSessionData}`);
    }

    if (missingIds.length) {
        throw(`Following IDs are missing in groups property: ${missingIds}`);
    }
}

// "modes" of the app

const modes = {
    "practice": "Practice",
    "delivery": "Delivery"
};

const subsections = [
    {
        section: "01",
        components: [
            {
                title: "What it's all about",
                key: "practice",
                path: "preparation/whats-it-all-about"
            }
        ]
    },
    {
        section: "02",
        components: [
            {
                title: "Checklist of things you will need",
                key: "practice",
                path: "preparation/checklist"
            }
        ]
    },
    {
        section: "03",
        components: [
            {
                title: "Further reading on the topic of the session",
                key: "practice",
                path: "preparation/further-reading"
            }
        ]
    },
    {
        section: "04",
        components: [
            {
                title: "Practice for the session",
                key: "practice",
                path: "preparation/practice"
            },
            {
                title: "Session plan",
                key: "delivery",
                path: "delivery/plan",
                injectCss: true
            }
        ]
    }
];

/**
 * @typedef Arguments
 * @type {object}
 * @property {string} config - File from which to load generation configuration
 * @property {string} toolUrl - URL to the Adapt authoring instance
 * @property {boolean} execute - Whether to execute the packaging commands
 * @property {string} username - Username for adapt
 * @property {string} password - Password for adapt
 */

/**
 * @typedef Configuration
 * @type {object}
 * @property {string} title - Title for the configuration (e.g. client name)
 * @property {string} name - Short name
 * @property {string} bucket - S3 bucket into which to upload the content
 * @property {string} directory - Directory in S3 into which to upload the content
 * @property {string} distribution - Cloudfront distribution to invalidate after upload
 * @property {string} query - Regex used to query Adapt Authoring for the courses
 * @property {string} url - Cloudfront access URL
 * @property {string} config - Directory in S3 into which to load the configuration
 * @property {boolean} generate_full - Generate a full description, including absolute URL paths
 * @property {string} generate_version - Which version number to add to the generated configuration
 * @property {string} seeker_enabled - Whether seekersync is enabled for this bundle
 * @property {string} language - Which language this configuration is for
 * @property {string} relative - Path prefix for the courses in the configuration file
 * @property {string} theme - Adapt theme to reset the course content to
 * @property {array} roots - Definition for the content nodes
 */

/**
 * @returns {Promise<void>}
 */
const listCourses = async function () {

        /**
         * @type {Arguments}
         */
        const argv = yargs
            .usage('Usage: $0 --config [configuration file ] --toolUrl [url to adapt] --username [user for adapt] --password [password for adapt] --execute')
            .describe('config', 'Configuration file to load (without .json extension)')
            .default('toolUrl', 'http://adapt-authoring.freeformers.com')
            .describe('toolUrl', 'URL to the Adapt authoring instance')
            .describe('username', 'Username for adapt')
            .describe('password', 'Password for adapt')
            .describe('execute', 'If specified, will run the package command directly')
            .boolean('execute')
            .default({'execute': false})
            .demandOption(['config', 'username', 'password'])
            .argv;

        const cookies = r.jar();

        /**
         * @type {Configuration}
         */
        const config = JSON.parse(fs.readFileSync(`${argv.config}.json`, 'utf8'));

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

        const loginResponse = await (r(loginOptions));

        if (loginResponse.statusCode !== 200) {
            throw(`Unable to log into authoring tool with error ${loginResponse.statusCode}`);
        }

        //console.log(`Logged into authoring tool ${argv.toolUrl}`);

        const queryOptions = {
            method: 'GET',
            uri: `${argv.toolUrl}/api/shared/course?search%5Btitle%5D=.*.*&operators%5Bskip%5D=0&operators%5Bsort%5D%5Btitle%5D=1`,
            jar: cookies,
            json: true
        };

        const courseArray = await (r(queryOptions));

        //console.log(JSON.stringify(courseArray, null, 2));

        const findCourse = (config.query && config.query.length > 0) ? new RegExp(config.query) : /^FRE_C([0-9]+)_M([0-9]+)\s.*$/;
        
        let customSessionRegExPatterns = []
        
        config.roots.forEach(sessionConfig => {
            sessionConfig.override_adapt_course
            && !customSessionRegExPatterns.includes(`^${sessionConfig.override_adapt_course}_M([0-9]+)\\s.*$`)
            && customSessionRegExPatterns.push(`^${sessionConfig.override_adapt_course}_M([0-9]+)\\s.*$`) && console.log(sessionConfig.override_adapt_course)
        });     

        let courses = [];

        courseArray.forEach(course => {
            let check = course.title.match(findCourse);
            if (!check && customSessionRegExPatterns.length) {
                for (let pattern of customSessionRegExPatterns) {
                    check = course.title.match(pattern);
                    if (check) break
                }
                if (!check) return
            }
            if (!check) return

            const root = _.find(config.roots, {course: check[1]});
            if (!root) return;

            const customMatchingPattern = root.override_adapt_course && `^${root.override_adapt_course}_M([0-9]+)\\s.*$`;

            let secondCheck;
            
            if (!customMatchingPattern) {
                secondCheck = course.title.match(findCourse);
                if (!secondCheck) return
            } else {
                secondCheck = course.title.match(customMatchingPattern);
                
                if (!secondCheck) return
            }

            const section = _.find(subsections, {section: check[2]});

            if (!section) return;
            // Need a mac/unix switch to put ./ in front of the script name
            const scriptCommand = `${os.type() === 'Linux' || os.type() === 'Darwin' ? './' : ''}package-course.js`;


            section.components.forEach(component => {
                const relativeUrl = `${config.directory}/${config.generate_full ? config.generate_version + '/' + config.language + '/' : ''}${root.path}/${component.path}`;
                
                const scriptOptions = `--courseName="${course.title}" --username ${argv.username} --password ${argv.password} --toolUrl ${argv.toolUrl} --bucket ${config.bucket} --directory ${relativeUrl} --theme ${config.theme} ${component.injectCss ? '--injectCss true' : ''}`;
                console.log(scriptCommand + " " + scriptOptions);

                const id = config.generate_full ? `${config.name}:${config.generate_version}:${config.language}:${root.course}` : root.prefix;
                
                const exists = _.find(courses, {id: id});

                if (!exists) {
                    courses.push({
                        "id": id,
                        "title": root.title,
                        "session_name": root.session_name,
                        "description": root.description
                    });

                    const courseObject = _.find(courses, {id: id});

                    if (config.generate_full) {
                        courseObject.graphic = root.prefix;
                        courseObject.contentId = root.course;
                    } else {
                        courseObject.url_friendly_name = `${config.relative ? config.relative : config.directory}/${root.path}`;
                    }

                }

                if (config.generate_full) {
                    
                    const courseObject = _.find(courses, {id: id});

                    if (!courseObject.hasOwnProperty(component.key)) {
                        courseObject[component.key] = {};
                        courseObject[component.key].components = [];
                        courseObject[component.key].title = modes[component.key];
                    }
                    
                    courseObject[component.key].components.push({
                        title: component.title,
                        url: `${config.url}/${relativeUrl}/index.html`
                    });
                }

                if (argv.execute) {
                    execSync(scriptCommand + " " + scriptOptions, {stdio: 'inherit'});
                }

            });
        });

        const numberExtractor = /^.*\b([0-9]+).*/;

        courses = courses.sort((a,b) => {
            const a_val = parseInt(a.session_name.match(numberExtractor)[1], 10);
            const b_val = parseInt(b.session_name.match(numberExtractor)[1], 10);


            if (a_val < b_val)
                return -1;

            if (a_val > b_val)
                return 1;

            return 0;
        });

        // Expected behavior for this file is to produce session data with no duplicated contentIds but just in case
        // we are playing with overrides there is this validation in palce but as I said, the logic is already skipping duplicates
        // first instance of a session with a given contentId will be the one that is picked up
        validateCoursesContentId(courses)

        const fullGeneratedOutput = {
            version: config.generate_version,
            title: config.title,
            name: config.name,
            language: config.language,
            seeker: config.seeker_enabled,
            sessions: courses
        };

        if (config.groups){
            validateRightGrouping(config.groups, courses)
            fullGeneratedOutput["groups"] = config.groups;
        }

        const output = config.generate_full ? fullGeneratedOutput : courses;

        console.log(JSON.stringify(output, null, 2));

        const configLocation = `${config.config ? config.config : config.directory + '/config.json'}`;

        console.log(`Location of configuration file is ${configLocation}`);
        if (argv.execute) {
            // Write the courses file
            const s3 = new AWS.S3({region: 'eu-west-2', logger: console});

            const params = {
                Key: configLocation,
                Bucket: config.bucket,
                ContentType: 'application/json',
                Body: JSON.stringify(output, null, 2),
                Metadata: {
                    'Content-Type': 'application/json'
                }
            };

            await (s3.putObject(params).promise());
        }

        if (argv.execute) {
            // Invalidate
            if (config.distribution && config.distribution.length > 0) {
                // We now need to invalidate the cloudfront cache
                // We can have 1000 invalidations a month free. But we can't
                // have more than 10 outstanding at once, so on a batch upload,
                // don't do this per course, but at the end of the upload.

                const targetPath = `/*`;

                console.log(`Submitting invalidation against ${config.distribution} at path ${targetPath}`);

                const cloudfront = new AWS.CloudFront();

                const invalidationParams = {
                    DistributionId: config.distribution,
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
                        DistributionId: config.distribution,
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
        }
    }
;

listCourses().then(function () {
    //console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});

