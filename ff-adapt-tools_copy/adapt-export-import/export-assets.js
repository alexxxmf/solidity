#!/usr/bin/env node
/**
 * export-assets.js
 *
 * Retrieve all assets and associated metadata
 */

const MongoDb = require('mongodb');
const MongoClient = MongoDb.MongoClient;
const fs = require('fs');
const r = require('request-promise');

/**
 * @typedef Arguments
 * @type {object}
 * @property {string} toolUrl - URL to the Adapt authoring instance
 * @property {string} dbUrl - URL to the MongoDB instance
 * @property {string} dbName - Name of the MongoDB database
 * @property {string} directory - Directory for the assets
 * @property {string} username - Username for adapt
 * @property {string} password - Password for adapt
 */

/**
 * @returns {Promise<void>}
 */
const main = async function () {

    /**
     * @type {Arguments}
     */
    const argv = require('yargs')
        .usage('Usage: $0 --toolUrl [url to adapt] --dbUrl [url to mongo] --dbName [name of db] --username [user for adapt] --password [password for adapt] --directory [output location]')
        .default('toolUrl', 'http://localhost:5000')
        .describe('toolUrl', 'URL to the Adapt authoring instance')
        .default('dbUrl', 'mongodb://localhost:27017')
        .describe('dbUrl', 'URL to the MongoDB instance')
        .default('dbName', 'adapt-tenant-master')
        .describe('dbName', 'Name of the MongoDB database')
        .default('directory','./assets/')
        .describe('directory', 'Directory for the assets')
        .describe('username', 'Username for adapt')
        .describe('password', 'Password for adapt')
        .demandOption(['username', 'password'])
        .argv;

    const client = await (MongoClient.connect(argv.dbUrl));

    console.log(`Connected successfully to server ${argv.dbUrl}`);

    const db = client.db(argv.dbName);

    // Read the asset list

    const assets = await(db.collection('assets').find().toArray());

    const loginOptions = {
        method: 'POST',
        uri: `${argv.toolUrl}/api/login`,
        form: {
            email: argv.username,
            password: argv.password
        },
        resolveWithFullResponse: true,
        jar: true
    };

    const loginResponse = await ( r(loginOptions) );

    if (loginResponse.statusCode !== 200) {
        throw(`Unable to log into authoring tool with error ${loginResponse.statusCode}`);
    }

    console.log(`Logged into authoring tool ${argv.toolUrl}`);

    await Promise.all(assets.map(async asset => {
        const assetGetOptions = {
            method: 'GET',
            uri: `${argv.toolUrl}/api/asset/serve/${asset['_id']}`,
            resolveWithFullResponse: true,
            jar: true,
            encoding: null
        };

        const assetResponse = await ( r(assetGetOptions) );

        console.log(`Retrieved asset ${asset['_id']}`);
        const data = Buffer.from(assetResponse.body);
        fs.writeFileSync(`${argv.directory}/${asset.filename}`, data);
    }));

    // Write out the entire assets array - we'll re-process on import

    const assetsData = JSON.stringify(assets, null, 2);

    console.log(assetsData);

    fs.writeFileSync(`${argv.directory}/assetsdata.json`, assetsData, {'encoding' : 'utf8' });

    await (client.close(false)); // Parameter is force-close
};


main().then(function () {
    console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});

