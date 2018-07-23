'use strict';

const confr = require('../../controllers/confreader.js');

/**
 * Bot client class
 * Bunch of methods and useful properties
 * @param {*} bot 
 */

module.exports.BotClient = function (bot) {
    this.bot = bot;

    /**
     * Init the properties of the bot
     */
    this.init = () => {        
        confr.readConf('./app/config/bot_config.json')
             .then(botConf => {
                // instance of Discord.Client()
                // token used to log in
                this.token = botConf['token'];
                // channel to post in
                this.mainChannel = botConf['mainChannel'];
                // path to history directory
                this.historyDir = botConf['historyDir'];

                // refresh the connected list
                this.refreshListRate = parseInt(botConf['refreshListRate']);

                // connect the bot to discord
                this.bot.login(this.token);
             })
             .catch(console.error);
    }
    
    /**
     * Incoming discord message handler
     * @param {Array} connectedClients 
     * @param {DiscordMessage} msg 
     */
    this.onmessage = (connectedClients, msg) => {

        let msgInfos = {
            author: stripText(msg.author.username),
            content: stripText(msg.content)
        };

        // make a shallow copy, it will be modified later on
        let msgInfosScp = {};

        for(let i in msgInfos){
            msgInfosScp[i] = msgInfos[i];
        }

        // for all clients connected
        connectedClients.forEach(client => {
            // if the client is authorized and connected
            if(client.isConnected && client.isAllowed) {

                // is the sender the same user as the current client ?
                // if so just break the flow
                if(msgInfos['author'] === this.bot.user.username && parseForUsername(msgInfos['content']) === client.username) return;
                // if not, modify the shallow copy of msgInfos
                else if(msgInfos['author'] === this.bot.user.username) {
                    // retrieve the username from the bot's message
                    msgInfosScp['author']  = parseForUsername(msgInfos['content']);
                    // retrieve the content of the bot's message
                    msgInfosScp['content'] = parseForText(msgInfos['content']);
                }
                
                // stringify before sending 
                let msgString = JSON.stringify(msgInfosScp);
                
                //emit to the client
                client.sock.emit('message', msgString);
            }
        });

    };


    /**
     * When receiving a new msg, display it in discord
     * @param {String} author 
     * @param {String} message 
     */
    this.emitMessage = (author, message) => {
        let toSend = 
`
_\`\`\`dsconfig
 ~ ${author} ~ from discordWebUI
\`\`\`_
${message}
`;
        this.bot.channels.get(this.mainChannel).send(toSend);
    };

    /**
     * Retrieve connected users
     * We clearly do not need to catch errors here, we just return the new promise
     */
    this.retrieveDiscordOnline = () => {
        // create a new promise
        return new Promise ((resolve, reject) => {
            // new array to store connected people
            let onlineList = [];
            
            // for each members of the channel, check if he's connected
            // 'Do Not Disturb', 'AFK', ... are considered as connected
            // [improvements] we may want to send the exact status one day
            this.bot.channels.get(this.mainChannel).members.forEach(m =>{
                if(m.presence.status != 'offline')
                    m.user.username === this.bot.user.username ? false : onlineList.push(m.user.username); // just a one liner
            });

            resolve(onlineList);
        });
    };
    
    /**
     * Refresh the connected list and send it through sockio
     * @param {Array} connectedClients
     */
    this.refreshList = (connectedClients) => {
        // call the function to retrieve the list from discord
        this.retrieveDiscordOnline()
        .then(list => {
            // add the connected discordWebUI clients to the list
            connectedClients.forEach(client => {
                if(client.isConnected && client.isAllowed)
                    list.push(client.username + ' ~');
            });

            // let stringify this to normalize all of our messages
            list = JSON.stringify({
                users:list
            });

            // for each connected clients, send them the list
            // they'll access it using data['users'][index]
            
            connectedClients.forEach(client => {
                if(client.isConnected && client.isAllowed)
                    client.sock.emit('connectedList', list);
            });
        });
    }
}; // end


/**
 * Remove html tags
 * @param {String} text 
 */
let stripText = (text) => {
    return text.replace(/<(?:.|\n)*?>/gm, '');
};

/**
 * Get the username in the bot's message
 * @param {String} text 
 */
let parseForUsername = (text) => {
    return text.substring(
        text.indexOf('~')+1,
        text.lastIndexOf('~')
    ).replace(/\s/g, '');
};


/**
 * Get the content of the bot's message
 * @param {String} text 
 */
let parseForText = (text) => {
    
    return text.substring(text.lastIndexOf('\`')+2);
};