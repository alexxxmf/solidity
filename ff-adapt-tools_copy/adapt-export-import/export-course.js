#!/usr/bin/env node
/**
 * export-course.js
 *
 * Export data from an adapt authoring database.
 * We don't use mongoose, as we don't necessarily know what
 * the schema could be, as different plugins to the authoring
 * framework can define additional mongoose schemas (in the adapt
 * tool) which we might not know about. Hence we need to use
 * the lower level API, and scan for all instances of "things" that
 * have the associated courseId that we're looking for.
 */

const MongoDb = require('mongodb');
const MongoClient = MongoDb.MongoClient;
const fs = require('fs');
const _ = require('lodash');
const flatmap = require('flatmap');

let exportObject = {};

let idMap = {}; // Build a list of ids to names, in order to construct the __ID strings on export

// Valid article names
const validArticles = [
    'Ignite',
    'Activate',
    'Boost',
    'Reflect'
];

/**
 * Substitute IDs for names
 */
function processForId(i) {
    if (i._parentId && (i._parentId in idMap)) {
        i._parentId = `__ID(${idMap[i._parentId]})`;
    }
    if (i._courseId && (i._courseId in idMap)) {
        i._courseId = `__ID(${idMap[i._courseId]})`;
    }
    if (i._componentType && (i._componentType in idMap)) {
        i._componentType = `__ID(${idMap[i._componentType]})`;
    }
    if (i._tenantId ) {
        i._tenantId = '__ID(TENANT)';
    }
    if (i.createdBy ) {
        i.createdBy = '__ID(USER)';
    }
    if (i.updatedBy ) {
        i.updatedBy = '__ID(USER)';
    }
}

/**
 * Process a list of objects, swapping in names for what is found in the idMap
 */
function processForIds(objects) {
    return objects.map(i => {
        processForId(i)
    });
}

/**
 * The config object is a bit more involved
 */
function processConfig(config) {
    processForId(config);

    if (config._enabledExtensions) {
        for (const i in config._enabledExtensions) {
            config._enabledExtensions[i]._id = `__ID(${idMap[config._enabledExtensions[i]._id]})`
        }
    }
}

/**
 * Check the article names are correct
 * based on the allowed list.
 * TODO - enfore a bit more, e.g. with a regex?
 * @param items
 */
function checkArticleNames(items) {
    items.forEach(i => {
        if (! ( validArticles.some(articleName => {
            return (i.title.indexOf(articleName) >= 0)
        })) ) {
            console.log(`Article name ${i.title} isn't one of ${validArticles.join()}`);
        }
    })
}

/**
 * @typedef Arguments
 * @type {object}
 * @property {string} courseName - Name of the course to export
 * @property {string} dbUrl - URL to the MongoDB instance
 * @property {string} dbName - Name of the MongoDB database
 * @property {string} directory - Directory for the course
 */

/**
 * @returns {Promise<void>}
 */
const main = async function () {

    /**
     * @type {Arguments}
     */
    const argv = require('yargs')
        .usage('Usage: $0 --courseName [course to export] --dbUrl [url to mongo] --dbName [name of db] --directory [JSON location]')
        .describe('courseName', 'Course to export')
        .default('dbUrl', 'mongodb://localhost:27017')
        .describe('dbUrl', 'URL to the MongoDB instance')
        .default('dbName', 'adapt-tenant-master')
        .describe('dbName', 'Name of the MongoDB database')
        .default('directory','./courses/')
        .describe('directory', 'Directory for the course JSON')
        .demandOption(['courseName'])
        .argv;

    const client = await(MongoClient.connect(argv.dbUrl));

    console.log(`Connected successfully to server ${argv.dbUrl}`);

    const db = client.db(argv.dbName);

    // Read the componenttypes out, as we need this to process components
    // as they have different IDs per authoring instance

    const componentTypes = ( await( db.collection('componenttypes').find().toArray() ) );

    // Process into the ID map:

    componentTypes.reduce((obj, i) => {

        if (i['name']) {
            obj[i['_id']] = i['name'];
        }

        return obj;
    }, idMap);

    // Read the extensiontypes out, as we need this to process components
    // as they have different IDs per authoring instance

    const extensionTypes = ( await( db.collection('extensiontypes').find().toArray() ) );

    // Process into the ID map:

    extensionTypes.reduce((obj, i) => {

        if (i['name']) {
            obj[i['_id']] = i['name'];
        }

        return obj;
    }, idMap);

    const courses = db.collection('courses');

    const course = ( await( courses.find({'title': argv.courseName}).toArray() ) )[0];

    if (!course) {
        throw `Course ${argv.courseName} could not be found`;
    }

    const collectionsRaw = await(db.collections());

    // collections is a bit "internal" to the mongodb driver - as they are all
    // inside a 's' variable, which looking at the code, means "state" - so the first thing
    // we can do is unwrap that
    const collections = collectionsRaw.map(i => i.s);

    // Now for an array of names of collections

    const collectionNames = collections.map(i => i.name);

    // Search each collection for an item with the right courseId
    // (Who knew this voodoo??) - update - some items have _courseId
    // in as an object type, and some as text
    /**
     * @type {ObjectID}
     */
    const courseId = course._id;
    const o_courseId = new MongoDb.ObjectID(courseId);

    const collectionItems = (await Promise.all( flatmap(collectionNames, async collectionName => {
        const items = await db.collection(collectionName).find(
            {
                $or:[
                    {'_courseId': o_courseId },
                    {'_courseId': courseId.toHexString() }
                ]}).toArray();

        // At this point, we can process the items and look for object IDs and tag them
        // so we know when we're importing how to re-wire them.
        // Initially we believed that title would be unique - however we now generate
        // these on import, and use the old _ids to wire them up. We do want to check
        // that the articles have the correct title though


        if (items.length > 0) return {
            'collection': collectionName,
            'items': items
        }

    }))).filter(Boolean);

    idMap[courseId] = 'COURSE';

    // Build up order (in terms of what we need to know) are:
    //  Replace on components, blocks, article, contentobject, course

    const processOrder = [
        'components',
        'blocks',
        'articles',
        'contentobjects',
        'courseassets'
    ];

    processOrder.forEach(component => {
        const collection = _.find(collectionItems, { 'collection' : component } );
        if (collection) {
            const items = collection.items;

            processForIds(items);

            if (component === 'articles') {
                checkArticleNames(items);
            }
        }
    });

    processForId(course);

    processConfig(_.find(collectionItems, { 'collection' : 'configs' } ).items[0]);

    exportObject.course = course;
    exportObject.collections = collectionItems;

    const courseData = JSON.stringify(exportObject, null, 2);

    console.log(courseData);

    fs.writeFileSync(`${argv.directory}/${argv.courseName}.json`, courseData);

    await(client.close(false)); // Parameter is force-close
};

main().then(function () {
    console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});

