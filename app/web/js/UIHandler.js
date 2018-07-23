// fuck le mode strict 

// change the title text above the shoutbox
function changeShoutboxTitle(newTitleString) {
    $('#windowTitleUI').text(newTitleString);
}

// change tab title
function changeTile(newTitleString) {
    $('title').text(newTitleString);
}

// clear the typing box
function clearTyping() {
    $('#typeBoxUI input[type=text]').val('')
}

// add a new message to the shoutbox
var msgColor = 'odd';
function displayNewMsg(author, content) {  
    // create the msg UI
    $(`
        <div class='messageBoxUI ${msgColor}'
            <p> [ <author>${author}</author> ] <content>${content}</content></p>
        </div>
    `).appendTo($('#shoutBoxUI'));

    // scroll down
    $('#shoutBoxUI').scrollTop(1E10)
    // switch the background color of the displayed msg
    if(msgColor === 'even') msgColor = 'odd';
    else msgColor = 'even';
};

// display connected users in the box area
function displayConnected(list) {
    var connectedBox = $('#connectedUsersUI');
    connectedBox.empty();
    list['users'].forEach(function(user){
        var newUser = document.createElement('div');
        newUser.classList.add('connectedUserBox')
        newUser.innerText = `* ${user}`;
        connectedBox.append(newUser);
    });
};

// play a sound on new msg
var playSound = true;
function setPlaySound() {
    playSound ? playSound = false : playSound = true;
};

function alertHandler() {
    if(playSound) document.getElementById('alertSound').play();
};

// asking for the password
function ask(forWhat, defaultString) {
    return window.prompt(forWhat, defaultString);
};
