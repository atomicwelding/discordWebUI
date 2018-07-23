'use strict';

const confr = require('../../controllers/confreader.js');
const emitError = require('../class/class_emit_error').emitError;

// path to models
let modelsDir = './app/models/'

/**
 * Client class
 * You normally want to create a new Client object for each new connection to socketio
 * @param {SOCKET} cSock
 */
module.exports.Client = function (cSock) {
    
    // client socket 
    this.sock = cSock;
    
    // retrieve username when logged in
    this.username = undefined;

    // compare password later on
    this.password = undefined;

    // this will help to verify if the client user is logged in
    this.isConnected = false;

    // permit or not to post/receive messages
    this.isAllowed = false;

    /**
     * Callback function for new connected client
     * @param {MAP} sent_infos 
     */
    this.onconnect = sent_infos => {

        this.isConnected = true;
        // unstringify infos
        sent_infos = JSON.parse(sent_infos);
        this.username = sent_infos['username'];
        this.password = sent_infos['password'];

        // test if the sent username only contains alphanumerical char
        if(RegExp('^[^a-z0-9]+$').test(this.username))
            this.sock.emit('status', new emitError('failure', 'username cannot receive special char ; it\'s only alphanumerical').toSent());
        else {
            // the conf file must be exactly named "${this.username}.json"
            // it implicitly tests if the sent username exists in the db
            // if not, throw an error
            confr.readConf(`${modelsDir}${this.username}.json`)
                 .then(data => {
                    if(this.password === data['password']) {
                        this.isAllowed = true;
                        this.sock.emit('status', new emitError('success', '').toSent())
                    }
                    else
                        this.sock.emit('status', new emitError('failure', 'wrong password').toSent());
                 })
                 .catch(error => {
                     if(error.code === 'ENOENT'){
                        this.sock.emit('status', new emitError('failure', 'username does not exist').toSent());
                     }
                     else {
                        this.sock.emit('status', new emitError('failure', 'internal server error, check out the logs').toSent());
                        console.error(error);
                     }
                 });
        }
    };

    /**
     * On 'leave' event ; reset properties
     */
    this.onleave = () => {
        this.isConnected = false;
        this.isAllowed = false;
    };

    /**
     * On a new message event, send it through to discord
     * @param {Discord.Client} discordBot 
     * @param {STRING} msg 
     */
    this.onmessage = (discordBot, msg) => {
        if(this.isConnected && this.isAllowed){
            discordBot.emitMessage(this.username, msg);
        }
    };
}