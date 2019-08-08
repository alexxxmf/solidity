#!/usr/bin/env node
/**
 * add-tag.js
 *
 * Add a tag directly into Mongo
 */

const MongoDb = require('mongodb');
const MongoClient = MongoDb.MongoClient;

// Timestamp of updates
const timeStamp = new Date();

/**
 * @typedef Arguments
 * @type {object}
 * @property {string} tagName - Tag name to add
 * @property {string} dbUrl - URL for the database
 * @property {string} dbName - Name of the database instance
 * @property {string} tenantName - Target tenant
 * @property {string} userEmail - Target user
 */

/**
 * @returns {Promise<void>}
 */
const main = async function () {

    /**
     * @type {Arguments}
     */
    const argv = require('yargs')
        .usage('Usage: $0 --tagName [tag to add] --dbUrl [url to mongo] --dbName [name of db] --tenantName [Tenant name] --userEmail [userEmail]')
        .describe('tagName', 'Tag name to add')
        .default('dbUrl', 'mongodb://localhost:27017')
        .describe('dbUrl', 'URL to the MongoDB instance')
        .default('dbName', 'adapt-tenant-master')
        .describe('dbName', 'Name of the MongoDB database')
        .default('tenantName', 'master')
        .describe('tenantName', 'Target tenant for insert')
        .describe('userEmail', 'Target user for insert')
        .demandOption(['tagName','userEmail'])
        .argv;

    const client = await(MongoClient.connect(argv.dbUrl));

    const db = client.db(argv.dbName);

    console.log(`Connected successfully to server ${argv.dbUrl}`);

    const user = ( await( db.collection('users').find( { 'email' : argv.userEmail } ).toArray() )[0] );
    const tenant = ( await( db.collection('tenants').find( { 'name' : argv.tenantName } ).toArray() )[0] );

    const tag = {
        '_isDeleted': false,
        '_tenantId': tenant._id,
        'title': argv.tagName,
        'updatedAt': timeStamp,
        'createdAt': timeStamp,
        'createdBy': user._id
    };

    await(db.collection('tags').insertOne(tag));

    await(client.close(false)); // Parameter is force-close
};

main().then(function () {
    console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});
