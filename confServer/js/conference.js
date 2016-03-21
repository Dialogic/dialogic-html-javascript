//
// Javascript for PowerMedia XMS 
//
////////////////////////////////////////////////////////

var my_xms = "XXX.XXX.XXX.XXX";
var myConf = null;

function initialize () {
	console.log("*** initialize - ENTER ***");
	
	var localVideo = document.getElementById("localVideo"); 
	var remoteVideo = document.getElementById("remoteVideo"); 
		
	var spec = { 'localVideo' : localVideo, 'remoteVideo' : remoteVideo, 'remoteAudio' : null, };
	var ret = myConf.initialize(spec);
	var mediaConstraints = { 'audio': true, 'video': true }; 
	
	myConf.acquireLocalMedia(mediaConstraints);
	
	if (ret != 'ok') {
		console.log("Error initializing user media");
	}
}

function conferenceLoginClickHandler() {
	
	console.log("*** conferenceLoginClickHandler - ENTER ***");
	
	// Create a new instance of Dialogic JavaScript library here
	myConf = new Dialogic();
	myConf.setHandlers(handlers);
	
	//Retrieve username info from HTML and pass for registration
	var username = document.getElementById("username");
	var my_xms_ws = "wss://" + my_xms + ":1080"; 
	
	myConf.register(username.value, my_xms_ws, '');	
}

function conferenceClickJoinHandler () {

	console.log("*** conferenceClickJoinHandler - ENTER ***");

	var confID = document.getElementById("confID");
	
	confID = "conf=" + confID.value + "@" + my_xms; 
	console.log("confID:" + confID);	
	
	var ret = myConf.call(confID, 'video');
	
	if (ret == 'ok') {
		document.getElementById("conferencePanel").hidden = true;
		document.getElementById("videoPanel").hidden = false;
	} else {
		console.log("Error attempting conferenceClickJoinHandler");
	}
}

//Call Handlers
var registerSuccessHandler = function () {
	console.log("*** registerSuccessHandler ***");
	
	document.getElementById("loginPanel").hidden = true;
	document.getElementById("conferencePanel").hidden = false;
	
	initialize();
};

var registerFailHandler = function () {
	console.log("*** registerFailHandler ***");
};
var ringingHandler = function () {
	console.log("*** ringingHandler ***");
};

var incomingCallHandler = function (name) {
	console.log("Incoming call from: "+name);
};

var callHangupHandler = function () {
	console.log("*** callHangupHandler ***");
};

var disconnectHandler = function () {
	console.log("*** disconnectHandler ***");
};

var userMediaSuccessHandler = function () {
	console.log("*** userMediaSuccessHandler ***");
};

var userMediaFailHandler = function (){
	console.log("*** userMediaFailHandler ***");
}

var remoteStreamAddedHandler = function () {
	console.log("remoteStreamAddedHandler");
};

var messageHandler = function () {
	console.log("*** messageHandler ***");
};

var infoHandler = function () {
	console.log("*** infoHandler ***");
};

var handlers = {
	'onRegisterOk': registerSuccessHandler, 
	'onRegisterFail': registerFailHandler, 
	'onRinging': ringingHandler, 
	'onConnected': null, 
	'onInCall': incomingCallHandler, 
	'onHangup': callHangupHandler, 
	'onDisconnect': disconnectHandler, 
	'onUserMediaOk': userMediaSuccessHandler, 
	'onUserMediaFail': userMediaFailHandler, 
	'onRemoteStreamOk': remoteStreamAddedHandler, 
	'onMessage': messageHandler, 
	'onInfo': infoHandler, 
	'onDeregister': null
};
