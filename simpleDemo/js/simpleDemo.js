// 
// Javascript for PowerMedia XMS Simpledemo
//
////////////////////////////////////////////////////////

var SimpleDemo = null;

$(document).ready(function() {

  $('#login').click(function(){
      var loginName =  document.getElementById("loginname").value;
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
        }
      }
  });

  $('#makecall').click(function(){
     if ($('#userCallType').is(':checked')) {
       showVideo();
     }
     else {
       hideVideo();
      }
      var callee =  document.getElementById("callname").value;
      writeStatus("Making call to " + callee);
      var callType = isVideoCall() ? 'video' : 'audio';
      var contentType = 'text/plain';
      var content = 'callOfferTestData';
      var result = SimpleDemo.call(callee, callType, contentType, content);
      if (result == "ok") {
	writeStatus("Call in progress");
      }
      else {
	writeStatus("Call failed");
      }

  $('#hangup').click(function(){
      var loginName =  document.getElementById("hangup").value;
      writeStatus("Hung up call");
      SimpleDemo.hangup("Caller hung up");
      this.style.visibility = "hidden";
      hideVideo();
  });
});  // end document ready

    writeStatus("Enter XMS Server addr, A/V choice, login name and press Login");
	
    // Register callback handlers
    var userHandlers = {
      'onRegisterOk': 		registerSuccess,
      'onRegisterFail': 	registerFail,
      'onRinging': 		callRingingHandler,
      'onConnected': 		callConnectedHandler,
      'onInCall': 		incomingCallHandler,
      'onHangup': 		callHangupHandler,
      'onDisconnect': 		callDisconnectHandler,
      'onUserMediaOk': 		userMediaSuccessHandler,
      'onUserMediaFail': 	userMediaFailHandler,
      'onRemoteStreamOk': 	remoteStreamAddedHandler,
      'onMessage': 		null,
      'onInfo': 		null,
      'onDeregister':		null
    };

    // Instantiate a new instance of Dialogic JavaScript library here
    SimpleDemo = new Dialogic();
    SimpleDemo.setHandlers( userHandlers );

}); // end document ready

// Utility functions

writeStatus = function(message) {
  console.log(message);
  var statusField = document.getElementById('status');
  statusField.value = message;
};

registerSuccess = function() {
  writeStatus("User registered with XMS. Allow camera/mic use");

  // Once user logged in, call type is set; don't allow it to change
  hideCheckbox ();

  var localVideoWindow = document.getElementById('localVideo');
  var remoteVideoWindow = document.getElementById('remoteVideo');

  // Video checkbox dtermines type of call
  if ($('#userCallType').is(':checked')) {
    console.log("Video call enabled");

    // Bind the video streams to the corresponding HTML <video> elements
    var avElements = {
      'localVideo': localVideoWindow,
      'remoteVideo': remoteVideoWindow 
    };
    //Invoke the initialize API with the correct HTML media elements
    SimpleDemo.initialize(avElements);
    obtainUserMedia(true, true);
  }
  else {
    console.log("Audio-only call enabled");

    // Bind the audio stream to the corresponding HTML <audio> element
    var rAudio = document.getElementById("remoteAudio");
    var avElements = {
      'remoteAudio': rAudio 
    };
    //Invoke the initialize API with the correct HTML media elements
    SimpleDemo.initialize(avElements);
    obtainUserMedia(true, false);
  }
};

// Callbacks

registerFail = function() {
  writeStatus("Registration failed.  Is user already registered with XMS?");
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
  document.getElementById("hangup").style.visibility = "visible";
  document.getElementById("makecall").style.visibility = "hidden";
};

remoteStreamAddedHandler = function() {
  writeStatus("Media connected");
};

callDisconnectHandler = function() {
  document.getElementById("makecall").style.visibility = "visible";
};

isVideoCall = function ( ) {
  var videoCall = document.getElementById("userCallType").checked;
  return videoCall;
};

obtainUserMedia = function ( audio, video ) {
  var mediaConstraints = {
    'audio': audio,
    'video': video
  };
  ret = SimpleDemo.acquireLocalMedia(mediaConstraints);
  if ( ret === 'ok' ) {
    console.log("acquireLocalMedia success");
  } else {
    alert("acquireLocalMedia API with media constraints: " + JSON.stringify(mediaConstraints) + " failed with: " + ret);
  }
};

hideCheckbox = function () {
  var checkbox = document.getElementById('userCallType');
  var checkboxLabel = document.getElementById('userCallTypeLabel');
  checkbox.style.visibility = "hidden";
  checkboxLabel.style.visibility = "hidden";
};

hideVideo = function () {
  var localVideoWindow = document.getElementById('localVideo');
  var remoteVideoWindow = document.getElementById('remoteVideo');
  localVideoWindow.style.visibility = "hidden";
  remoteVideoWindow.style.visibility = "hidden";
};

showVideo = function () {
  var localVideoWindow = document.getElementById('localVideo');
  var remoteVideoWindow = document.getElementById('remoteVideo');
  localVideoWindow.style.visibility = "visible";
  remoteVideoWindow.style.visibility = "visible";
};
  
