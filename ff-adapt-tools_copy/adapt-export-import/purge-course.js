#!/usr/bin/env node
/**
 * purge-course.js
 *
 * Brute force remove all items that match a course ID
 */

const MongoDb = require('mongodb');
const MongoClient = MongoDb.MongoClient;

const main = async function () {
    const argv = require('yargs')
        .usage('Usage: $0 --courseId [course to purge] --dbUrl [url to mongo] --dbName [name of db]')
        .describe('courseId', 'Course Id to purge')
        .default('dbUrl', 'mongodb://localhost:27017')
        .describe('dbUrl', 'URL to the MongoDB instance')
        .default('dbName', 'adapt-tenant-master')
        .describe('dbName', 'Name of the MongoDB database')
        .demandOption(['courseId'])
        .argv;

    const client = await(MongoClient.connect(argv.dbUrl));

    const db = client.db(argv.dbName);

    console.log(`Connected successfully to server ${argv.dbUrl}`);

    const collectionsRaw = await(db.collections());

    // collections is a bit "internal" to the mongodb driver - as they are all
    // inside a 's' variable, which looking at the code, means "state" - so the first thing
    // we can do is unwrap that
    const collections = collectionsRaw.map(i => i.s);

    // Now for an array of names of collections

    const collectionNames = collections.map(i => i.name);

    const o_courseId = new MongoDb.ObjectID(argv.courseId);

    await collectionNames.forEach(async function(collectionName) {
        await( db.collection(collectionName).deleteMany(
            {
                $or:[
                    {'_courseId': o_courseId },
                    {'_courseId': argv.courseId },
                    {'_id' : o_courseId },
                    {'_id' : argv.courseId }
                ]}) );
    });

    await(client.close(false)); // Parameter is force-close
};

main().then(function () {
    console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});
