#!/usr/bin/env node
/**
 * import-course.js
 *
 * Import a course from an exported JSON file
 */

const MongoDb = require('mongodb');
const MongoClient = MongoDb.MongoClient;
const fs = require('fs');
const _ = require('lodash');

// Timestamp of updates
const timeStamp = new Date();

let nameMap = {};   // Build a list of names to ObjectIDs, to reconstruct the correct IDs on import

const re = /^__ID\((.*)\)$/;

/**
 * Substitute names for IDs (and remove redundant IDs)
 */
function processForName(i) {
    if (i._parentId) {
        const parsed = re.exec(i._parentId);

        if (parsed) {
            i._parentId = nameMap[re.exec(i._parentId)[1]];
        } else {
            i._parentId = nameMap[i._parentId];
        }
    }
    if (i._courseId) {
        i._courseId = nameMap[re.exec(i._courseId)[1]];
    }
    if (i._componentType) {
        i._componentType = nameMap[re.exec(i._componentType)[1]];
    }
    if (i._tenantId) {
        i._tenantId = nameMap[re.exec(i._tenantId)[1]];
    }
    if (i.createdBy) {
        i.createdBy = nameMap[re.exec(i.createdBy)[1]];
    }
    if (i.updatedBy) {
        i.updatedBy = nameMap[re.exec(i.updatedBy)[1]];
    }
    if (i.updatedAt) {
        i.updatedAt = timeStamp;
    }
    if (i.createdAt) {
        i.createdAt = new Date(i.createdAt);
    }
    if (i._contentTypeParentId) {
        const parsed = re.exec(i._contentTypeParentId);

        if (parsed) {
            i._contentTypeParentId = nameMap[re.exec(i._contentTypeParentId)[1]];
        } else {
            i._contentTypeParentId = nameMap[i._contentTypeParentId];
        }
    }
    if (i._contentTypeId) {
        const parsed = re.exec(i._contentTypeId);

        if (parsed) {
            i._contentTypeId = nameMap[re.exec(i._contentTypeId)[1]];
        } else {
            i._contentTypeId = nameMap[i._contentTypeId];
        }
    }

}

/**
 * Replace names with the appropriate IDs ready for insertion
 * into Mongo
 */
function processForNames(objects) {
    return objects.map(i => {
        processForName(i);
    })
}

/**
 * The config object is a bit more involved
 */
function processConfig(config, course, xAPIEnable, xAPIUrl) {
    processForName(config);
    delete config._id;

    if (config._enabledExtensions) {
        for (const i in config._enabledExtensions) {
            config._enabledExtensions[i]._id = nameMap[re.exec(config._enabledExtensions[i]._id)[1]];
        }
    } else {
        config._enabledExtensions = {};
    }

    // To inject an extension, we need to add to the
    // enabled extensions, and then add a configuration
    // block for the extension.
    if (xAPIEnable) {
        if (!config._enabledExtensions.altxapi) {
            config._enabledExtensions['altxapi'] = {
                'targetAttribute': '_altxapi',
                'version': '0.0.3',
                'name': 'ff-alt-xapi',
                '_id': nameMap['ff-alt-xapi']
            };
            if (!config._extensions) {
                config._extensions = {};
            }
            config._extensions['_altxapi'] = {
                '_homePage': 'http://www.freeformers.com',
                '_fullName': 'XXXX',
                '_mbox': 'mailto:XXX@example.com',
                '_password': 'XXX',
                '_userName': 'XXX',
                '_endPoint': xAPIUrl,
                '_launchMethod': 'hardcoded',
                '_ignoreEvents': [],
                '_saveLoadState': false,
                '_localLoggingOnly': false,
                '_identifyById': false,
                '_courseID': `http://fwmcourses.com/course/${course.title}`,
                '_isEnabled': true
            };
        }
    }
}

/**
 * Asset filenames are a hash of their contents, so remain the same
 */
function processCourseAsset(courseAsset, assets) {
    const theAsset = _.find(assets, { 'filename': courseAsset['_fieldName'] } );

    if (theAsset) {
        courseAsset['_assetId'] = new MongoDb.ObjectID(theAsset['_id']);
    }

    courseAsset._contentTypeParentId = courseAsset._contentTypeParentId.toString();
    courseAsset._contentTypeId = courseAsset._contentTypeId.toString();
    courseAsset._courseId = courseAsset._courseId.toString();
    courseAsset._assetId = courseAsset._assetId.toString();

}

/**
 * @typedef Arguments
 * @type {object}
 * @property {string} courseName - Name of the course to import
 * @property {string} dbUrl - URL to the MongoDB instance
 * @property {string} dbName - Name of the MongoDB database
 * @property {string} directory - Directory for the course
 * @property {string} tenantName - Target tenant for the import
 * @property {string} userEmail - Target user for the import
 * @property {boolean} xAPIEnable - Build in support for xAPI
 * @property {string} xAPIUrl - URL to configure into the xAPI extension
 */

/**
 * @returns {Promise<void>}
 */
const main = async function () {

    /**
     * @type {Arguments}
     */
    const argv = require('yargs')
        .usage('Usage: $0 --courseName [course to export] --dbUrl [url to mongo] --dbName [name of db] --tenantName [Tenant name] --userEmail [userEmail] --xAPIEnable [t/f] --xAPIUrl [xAPI URL] --directory [JSON location]')
        .describe('courseName', 'Course to import')
        .default('dbUrl', 'mongodb://localhost:27017')
        .describe('dbUrl', 'URL to the MongoDB instance')
        .default('dbName', 'adapt-tenant-master')
        .describe('dbName', 'Name of the MongoDB database')
        .default('tenantName', 'master')
        .describe('tenantName', 'Target tenant for import')
        .describe('userEmail', 'Target user for import')
        .default('directory','./courses/')
        .describe('directory', 'Directory for the course JSON')
        .boolean('xAPIEnable')
        .default('xAPIEnable',false)
        .describe('xAPIEnable', 'Insert configuration for the x-API extension')
        .default('xAPIUrl','https://xapi-dev.freeformers.com/xAPI/')
        .describe('xAPIUrl','Configured target xAPI endpoint')
        .demandOption(['courseName', 'userEmail'])
        .argv;

    const client = await(MongoClient.connect(argv.dbUrl));

    console.log(`Connected successfully to server ${argv.dbUrl}`);

    const courseData = fs.readFileSync(`${argv.directory}/${argv.courseName}.json`, {'encoding' : 'utf8' });

    const importObject = JSON.parse(courseData);

    const db = client.db(argv.dbName);

    // Read the componenttypes out, as we need this to process components
    // as they have different IDs per authoring instance

    const componentTypes = ( await( db.collection('componenttypes').find().toArray() ) );
    const extensionTypes = ( await( db.collection('extensiontypes').find().toArray() ) );
    const assets = ( await( db.collection('assets').find().toArray() ) );

    const user = ( await( db.collection('users').find( { 'email' : argv.userEmail } ).toArray() )[0] );
    const tenant = ( await( db.collection('tenants').find( { 'name' : argv.tenantName } ).toArray() )[0] );

    nameMap['USER'] = new MongoDb.ObjectID(user._id);
    nameMap['TENANT'] = new MongoDb.ObjectID(tenant._id);

    // Process into the ID map:

    componentTypes.reduce((obj, i) => {

        if (i['name']) {
            obj[i['name']] = i['_id'];
        }

        return obj;
    }, nameMap);

    extensionTypes.reduce((obj, i) => {

        if (i['name']) {
            obj[i['name']] = i['_id'];
        }

        return obj;
    }, nameMap);

    // We now build the course top down - that is:
    // course, contentobjects, articles, blocks, components

    const processOrder = [
        'contentobjects',
        'articles',
        'blocks',
        'components',
        'courseassets'
    ];

    const course = importObject.course;

    processForName(course);
    delete course._id;

    // When we first write the course, we don't have the components in place
    // to write the startup items.

    await( db.collection('courses').insertOne(course) );

    console.log(`Course inserted with _id ${course._id}`);

    nameMap['COURSE'] = new MongoDb.ObjectID(course._id);

    // Process the remain document objects in order:

    await Promise.all(processOrder.map(async component => {
        const collection = _.find(importObject.collections, { 'collection' : component } );
        if (collection) {
            const items = collection.items;

            processForNames(items);

            await Promise.all(items.map(async function(i) {
                const oldId = i['_id'];

                delete i._id;

                if (component === 'courseassets') {
                    processCourseAsset(i, assets);
                }

                // Re-process titles for uniqueness
                if (argv.xAPIEnable) {
                    if (component === 'articles') {
                        const parentContentObject = await(db.collection('contentobjects').find({'_id': i['_parentId']}).toArray())[0];

                        if (parentContentObject) {
                            i['title'] = `${parentContentObject.title}_${i._sortOrder}`;
                        }
                    }

                    if (component === 'blocks') {

                        const parentArticle = await(db.collection('articles').find({'_id': i['_parentId']}).toArray())[0];

                        if (parentArticle) {
                            i['title'] = `${parentArticle.title}_${i._sortOrder}`;
                        }
                    }

                    if (component === 'components') {
                        const parentBlock = await(db.collection('blocks').find({'_id': i['_parentId']}).toArray())[0];

                        if (parentBlock) {
                            i['title'] = `${parentBlock.title}_${i._component}`;
                        }
                    }
                }

                await(db.collection(component).insertOne(i));

                nameMap[oldId] = new MongoDb.ObjectID(i['_id']);

            }));
        }
    }));

    const config = _.find(importObject.collections, { 'collection' : 'configs' } ).items[0];

    processConfig(config, course, argv.xAPIEnable, argv.xAPIUrl);

    await( db.collection('configs').insertOne(config) );

    // We now need to re-process the course object to handle startup items etc.
    // Need a better pattern for these, as I'm sure there'll be others
    if (course._start && course._start._startIds) {
        course._start._startIds.map(i => {
            if (i._id) {
                i._id = nameMap[i._id];
            }
        })
    }

    await( db.collection('courses').updateOne({ '_id' : course._id }, {$set: {'_start': course._start} }) );

    await(client.close(false)); // Parameter is force-close
};

main().then(function () {
    console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});
