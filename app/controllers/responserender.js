const fs    = require('fs');
const util  = require('util');
const url   = require('url');
const path  = require('path');

const mimeType = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.eot': 'appliaction/vnd.ms-fontobject',
    '.ttf': 'application/font-sfnt'
};

const binaryType = ['.jpg', '.png', '.ico', '.wav', '.mp3', '.svg', '.pdf', '.doc', '.eot', '.ttf'];

const pReadFile = util.promisify(fs.readFile);

/**
 * Render a response and send it
 * @param {IncomingMessage} req 
 * @param {ServeResponse} res 
 * @param {STRING_PATH_TO_FILE} pathname 
 */
module.exports.resRender = (req, res, pathname) => {
    // we'll check the mime type further to specify the encoding and content-type
    let extension = path.parse(pathname).ext;
    let IsItATextfile = true;
    if(binaryType.indexOf(extension) != -1 ) IsItATextfile = false;

    pReadFile(pathname, IsItATextfile ? 'utf8':null)
        .then(content => {
            res.setHeader('Content-type', mimeType[extension] || 'text/plain');
            res.end(content);
        })
        .catch(error => {
            if(error.code === 'ENOENT') {
                res.statusCode = 404;
                res.end('File not found');
            }
            else {
                res.statusCode = 500;
                res.end('Internal server error, check out the logs');
                console.error(error)
            }
        });
};