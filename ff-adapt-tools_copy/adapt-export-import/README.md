# Adapt import/export for the authoring tool

All tools use argv command line handling, so invoking with no parameters
will list out how to use it.

# HOWTO TL/DR - Push a new bundle for Mentor
* Checkout this repo using git

```
git clone https://github.com/Freeformers/ff-adapt-tools
```

* Install and configure the AWS CLI
* Ensure you have working AWS credentials configured into your account
on your computer - i.e. follow the AWS CLI instructions and test them
* Make sure NodeJS is installed on your computer and is in the path
  * For Windows machines, this means additionally ensuring that the command
handler understands the .js extension and this is associated with Node.
* Install the project dependencies by running:
```
npm install
```
* The configured bundles each have config files in the config directory, so
look in there to see which bundles can be pushed.
* Always make sure you have the latest version of the code and the config

```
git pull
```

* Then from the adapt-export-import directory, to test (without
actually triggering changes), run (e.g. for the Tesco bundle) using your
own credentials:

```
list-courses.js --config config/tesco --username me@freeformers.com --password freeformers
```
* Doing so should show a list of commands, and finally a block of config. Any
errors should be investigated
* To actually trigger the invocation of the commands, append the `--execute` flag to the
end of the above command line. Note that this will take a while! Errors
may still occur if the actual packaging process fails. Advise to run this
out of hours for existing customers.



## add-tag.js

Add a tag directly to the database.

## export-assets.js

This tool reads all the assets from Mongo, then uses the API to retrieve each asset
and writes these to a specified directory, along with a json document describing
the assets.

## export-course.js

This tool reads mongo to find a course by name, and then to write out anything
in the database that corresponds to the found courseId to a specified location
as a json document.

## import-assets.js

Using a json document written by the export tool, this tool reads the current
assets, and uploads any missing ones.

## import-course.js

This tool reads a json document written by export-course.js, and inserts it
into mongo. This is a multi-phase approach, to ensure the ids are all correctly
wired together.

In addition, this takes a flag to enable xAPI - when this is specified, configuration
for the xAPI plugin will be written, and all titles will be re-processed to
ensure that they are unique.

## list-courses.js

Lists out the courses found that match a particular regex that identifies them
as courses that should be uploaded. TBD that this should be based on tags. Also this
script will generate package-course command lines to upload the found set
of courses to S3 if required.

## package-course.js

This will find a course by name, reset the theme (which writes the rebuild flag),
and then either downloads a zip of the built/packaged course, or streams it into
S3.

## purge-course.js

Given a courseId, this will remove anything from mongo with that courseId.

## sync-launchpad-content.js

TBD.

# Notes

## Overview

The authoring tool stores data in MongoDB, as it is entirely plugin
based, and each plugin defines a mongoose schema subsequently used.

## Schema/structure

The initial approach was to process the IDs out into an __ID('') which
referred to an object title. However, the authoring tool happily lets
people create items with duplicate titles, and as a result, the only
primary key available is actually the id.

Hence the resultant approach is to save out the objects without processing
down the ids of blocks and components, and re-writing them on load.

## Asset synchronisation

Assets need to be synchronised for a successful build...

Assets can be retrieved from the API, e.g.:
http://localhost:5000/api/asset/serve/5abb56a4479113e2603265ec

This needs to be an authenticated connection with a cookie.

Asset filenames are (luckily!) hashes of the content - hence they are the
same between instances (provided the file data is the same). This allows
us to easily look up assets and wire up the correct ID into the asset
table on import. Note that the fieldname for filename is _fieldName in the
courseassets documents.

The other items in the courseassets documents are:

* _contentTypeParentId - this is an ID into blocks
* _contentTypeId - this is an ID into components, as...
* _contentType - this always appears to be "component" but perhaps it is possible
for another value to mean another collection in which to look up the contentTypeId

## Refresh of themes

Upload via the API, then reset the theme (this can be seen in package-course.js)

## Force rebuild

Resetting the theme causes a rebuild to be staged (by writing a rebuild file)

## Titles

If xAPI is enabled, article, block and component titles are generated from the content object names, by adding
sort order and component names. Therefore, provided the content object titles are
unique, all block and component titles will be unique.

