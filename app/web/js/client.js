// fuck le mode strict 

$(document).ready(function () {
    var socket = io();
    socket.connect();

    // ask for username and password
    var name = ask('username', '');
    var pwd = ask('password', '');

    var dataToLog = {
        username:name,
        password:pwd
    };

    // emit username:password and wait for a response
    changeShoutboxTitle('Logging in...');
    socket.emit('wait_accept', JSON.stringify(dataToLog));

    socket.on('status', function (status) {
        //check status
        status = JSON.parse(status);
        if(status['state'] === 'success') changeShoutboxTitle('Connected');
        else if(status['state'] === 'failure') changeShoutboxTitle(`Failure : ${status['reason']}`);
        else changeShoutboxTitle('Internal server error');
    });

    // on new message
    socket.on('message', function (c) {
        c = JSON.parse(c);
        displayNewMsg(c['author'], c['content']);

        alertHandler();
    });

    // on refreshing list event
    socket.on('connectedList', function (data) {
        data = JSON.parse(data);
        displayConnected(data);
    });

    // input 'press the enter key' event trigger
    $('#typeBoxUI input[type=text]').keydown(function (e) {
        if(e.keyCode === 13){
            var data = $('#typeBoxUI input[type=text]').val();
            socket.emit('message', data);
            displayNewMsg(name, data);
            clearTyping();
            return false; //prevent from reloading the page
        }
    });

    // window leaving event 
    $(window).on('unload', function () {
        socket.emit('leave');
    });
});