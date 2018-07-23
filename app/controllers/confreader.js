'use strict';

const util  = require('util');
const fs    = require('fs');

const pReadFile = util.promisify(fs.readFile);

/**
 * Returns a single map with retrieved infos
 * @param {STRING_PATH_TO_FILE} path 
 */
module.exports.readConf = async path => {
    return await pReadFile(path, 'utf8').then(c => {return JSON.parse(c)});
};