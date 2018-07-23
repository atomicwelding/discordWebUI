// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = //
//                           DiscordWebUI  - by weld                           //
//      simple web interface for discord using websockets and discord.js       //
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = //


'use strict';

const http              = require('http');
const url               = require('url');
const path              = require('path');


const dc                = require('discord.js');

const util              = require('util');
const fs                = require('fs');

const WebSocketServer   = require('socket.io');

const confr             = require('./app/controllers/confreader.js');
const resren            = require('./app/controllers/responserender.js');

const Client            = require('./app/controllers/class/class_client.js').Client;
const BotClient         = require('./app/controllers/class/class_dc_bot.js').BotClient;

/**
 * Entry point of the program ! Ensure we get basic infos to start the webserver
 * @param {INT} port 
 * @param {STRING_PATH_TO_FILE} mainFile 
 * @param {STRING_PATH_TO_DIR} webRootDir 
 */
const entry_point = (port, mainFile, webRootDir) => {
    
    
    // prevent from getting two / char at the end of a requested path
    if(webRootDir.slice(-1) == '/') webRootDir = webRootDir.substr(0, webRootDir.length-1);

    /**
     * Create a webserver ; it will serve static files and proxying websocket
     * @param {FUNCTION} requestHandler
     */
    let webServer = http.createServer((req, res) => {
        
        // parse the url and get the pathname of the file
        let parsedUrl = url.parse(req.url);
        let pathname = `${webRootDir}${parsedUrl.pathname}`;
        
        // accessing to the root leads to main file
        if(pathname === webRootDir+'/') pathname = webRootDir+'/'+mainFile;

        resren.resRender(req, res, pathname);
    });

    // proxy websockets through the http server
    const io = new WebSocketServer(webServer);

    // list of all connected Client() objects
    let connectedClients = [];

    // create the discord bot 
    const bot = new dc.Client();
    let botClient = new BotClient(bot);

    // init properties and log in the bot
    botClient.init();



    /**
     * Websocket main listener 
     */
    io.sockets.on('connection', clientSocket => {
        let client = new Client(clientSocket);

        // push new client into the connected clients list
        connectedClients.push(client);
        
        // username, password, and so on
        client.sock.on('wait_accept', client.onconnect);
        
        // client disconnect
        client.sock.on('leave', client.onleave);

        // on incoming message
        client.sock.on('message', message => {
            client.onmessage(botClient, message);
        });
    });

    webServer.listen(port);

    /**
     * Discord bot listener
     */

    // when connected
    botClient.bot.on('ready', () => {
        // console.log('Bot connected to discord, channel : ', botClient.mainChannel);

        // on new incoming message, call the handler with a connected sockets map and the msg
        botClient.bot.on('message', message => {
            botClient.onmessage(connectedClients, message);
        });
        
        // refresh the connected list
        setInterval(() => {
            botClient.refreshList(connectedClients);
        }, botClient.refreshListRate);
    });

};

/**
 * Reading the webserver conf file and call the entry point
 */
confr.readConf('./app/config/server_config.json')
     .then(c => {
         entry_point(c['port'], c['main_file'], c['web_root_dir']);
     });