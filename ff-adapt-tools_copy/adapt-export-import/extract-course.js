#!/usr/bin/env node
/**
 * extract-course.js - Extracts components from courses
 * that are locally accessible. Allows for translation
 * via AWS. Prototype!
 */

const _ = require('lodash');
const fs = require('fs');
const yargs = require('yargs');
const AWS = require('aws-sdk');
const stripTags = require('locutus/php/strings/strip_tags');

/**
 * @typedef Arguments
 * @type {object}
 * @property {string} courseDirectory - Root directory of the Adapt course
 * @property {string} lang - Target translation language
 * @property {boolean} stripTags - Remove HTML markup
 */

/**
 * @returns {Promise<void>}
 */
const extractCourse = async () => {

    /**
     * @type {Arguments}
     */
    const argv = yargs
        .usage('Usage: $0 --courseDirectory [course directory]')
        .describe('courseDirectory', 'Root directory of an Adapt course')
        .describe('lang', 'Target translation language')
        .describe('stripTags', 'Remove HTML Markup')
        .boolean('stripTags')
        .default({'stripTags': false})
        .default('lang', 'en')
        .demandOption(['courseDirectory'])
        .argv;

    //const configData = fs.readFileSync(`${argv.courseDirectory}/course/config.json`);
    //const courseData = fs.readFileSync(`${argv.courseDirectory}/course/en/course.json`);
    const contentObjectData = fs.readFileSync(`${argv.courseDirectory}/course/en/contentObjects.json`);
    const articleData = fs.readFileSync(`${argv.courseDirectory}/course/en/articles.json`);
    const blockData = fs.readFileSync(`${argv.courseDirectory}/course/en/blocks.json`);
    const componentData = fs.readFileSync(`${argv.courseDirectory}/course/en/components.json`);

    //const config = JSON.parse(configData);
    //const course = JSON.parse(courseData);
    const contentObjects = JSON.parse(contentObjectData);
    const articles = JSON.parse(articleData);
    const blocks = JSON.parse(blockData);
    const components = JSON.parse(componentData);

    //const courseId = config['_courseId'];

    let outputObject = [];

    // Need to look out for ul and il for lists

    contentObjects.forEach(contentObject => {
        const article = _.find(articles, {_parentId: contentObject._id});

        blocks.filter(block => {
            return block._parentId === article._id
        }).map(block => {
            components.filter(component => {return component._parentId === block._id} )
                .map(component => {
                    if (component.body.length) {
                        if (argv.stripTags) {
                            const body = component.body.replace(new RegExp("</li><li>", 'g'), ". ").replace(new RegExp("&#39;", 'g'), "'");
                            const text = stripTags(body);

                            outputObject.push(text);
                        } else
                            outputObject.push(component.body);
                    }
                    if (component.instruction.length) {
                        outputObject.push(component.instruction);
                    }
                })
        });
    });

    if (argv.lang !== 'en') {
        AWS.config.region = 'us-east-1';
        const translate = new AWS.Translate();

        const translatedPromises = outputObject.map(text => {
            return translate.translateText({
                SourceLanguageCode: 'en',
                TargetLanguageCode: argv.lang,
                Text: text
            }).promise()
        });

        const translatedOutput = await Promise.all(translatedPromises);

        outputObject = translatedOutput.map(item=> item.TranslatedText);
    }

    const outputData = JSON.stringify(outputObject, null, 2);

    console.log(outputData);
};

extractCourse().then(function () {
    //console.log("Done");
    process.exit();
}).catch(function (e) {
    console.log("Error - " + e);
    process.exit();
});

