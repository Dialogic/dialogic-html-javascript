//
// Javascript for PowerMedia XMS Simple Demo
//
////////////////////////////////////////////////////////

var SimpleDemo = null;

$(document).ready(function() {

    $('#login').click(function(){
        var loginName = document.getElementById("loginname").value;
        var xmsIpAddr = document.getElementById("xmsipaddr").value;

        if (xmsIpAddr == "") {
            writeStatus("Enter XMS IP address");
        }
        else {
            if (loginName == "") {
            writeStatus("Enter Login Name");
        }
        else {
            var wsUrl = "ws://" + xmsIpAddr + ":1080"; 
            writeStatus("Logging in as " + loginName + " to "+ wsUrl); 
            SimpleDemo.register(loginName, wsUrl);
            document.getElementById("login").style.visibility = "hidden";
        }
    }
});

$('#makecall').click(function(){

    var callee = document.getElementById("callname").value;
    writeStatus("Making call to " + callee);
    var result = SimpleDemo.call(callee, "video");

    if (result == "ok") {
        writeStatus("Call in progress");
    }
    else {
        writeStatus("Call failed");
    }

    $('#hangup').click(function(){
    var loginName = document.getElementById("hangup").value;
        writeStatus("Hanging up call");
        SimpleDemo.hangup("Caller hung up");

        //this.style.visibility = "hidden";
        window.Close();
    });
});  // end document ready

writeStatus("Please Login...");

// Register callback handlers 
var userHandlers = {
'onRegisterOk':        registerSuccess,
'onRegisterFail':      registerFail,
'onRinging':           callRingingHandler,
'onConnected':         callConnectedHandler,
'onInCall':            incomingCallHandler,
'onHangup':            callHangupHandler,
'onDisconnect':        null,
'onUserMediaOk':       userMediaSuccessHandler,
'onUserMediaFail':     userMediaFailHandler,
'onRemoteStreamOk':    remoteStreamAddedHandler,
'onMessage':           null,
'onInfo':              null,
'onDeregister':        null
};

// Instantiate a new instance of Dialogic JavaScript library here
    SimpleDemo = new Dialogic(); SimpleDemo.setHandlers( userHandlers ); 
}); // end document ready

// Utility functions

writeStatus = function(message) {
    console.log(message);
    var statusField = document.getElementById('status');
    statusField.value = message;
};

registerSuccess = function() {
    writeStatus("User registered with XMS. Allow camera/mic use");

    // Bind the video streams to the corresponding HTML <video> elements 
    var lVideo = document.getElementById("localVideo");
    var rVideo = document.getElementById("remoteVideo");

    /* Now invoke the initialize API with HTML video elements*/
    var avElements = {
    'localVideo': lVideo,
    'remoteVideo': rVideo
}; 

SimpleDemo.initialize(avElements);

// Finally, get access to local media devices 
var mediaConstraints = {
    'audio': true,
    'video': true
};

SimpleDemo.acquireLocalMedia(mediaConstraints);

};



// Callbacks
registerFail = function() {
    writeStatus("User not registered with XMS");
};

incomingCallHandler = function() {
    writeStatus("Call offered");
};

callHangupHandler = function() {
    writeStatus("Hangup"); 
};
userMediaSuccessHandler = function() {
    writeStatus("Browser mic/camera in use. Enter name to call and press Make Call");
};

userMediaFailHandler = function() {
    writeStatus("Browser Mic/Camera cannot be accessed");
};

callRingingHandler = function() {
    writeStatus("Remote side ringing");
};

callConnectedHandler = function() {
    writeStatus("Remote side connected");
    document.getElementById("makecall").style.visibility = "hidden";
    document.getElementById("hangup").style.visibility = "visible";
    document.getElementById("hangup").style.width = "300px";
    document.getElementById("remoteVideo").style.visibility = "visible";
};

remoteStreamAddedHandler = function() {
    writeStatus("Media connected");
};
