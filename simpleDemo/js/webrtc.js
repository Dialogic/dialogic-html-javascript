/////////////////////////////////////////////////////////////////
// Javascript file used to make a video call between 2 clients //
/////////////////////////////////////////////////////////////////

//-- Dialogic class view --//
function Dialogic( ) {
  this.isChrome = false;
  this.isFirefox = false;
  this.isCaller = false;
  this.isCallee = false;
  this.userToCall = null;
  this.guest = null;
  this.started = false;
  this.remoteMediaAdded = false;
  this.channelReady = false;
  this.pc = null;
  this.socket = null;
  this.room = null;
  this.mediaConstraints = { "audio":true,"video":{"mandatory":{},"optional":[]} };
  this.sdpConstraints = { 'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true} };
  this.userRegistered = false;
  this.callOfferMsg = { };
  this.callType = 'video';

  var localStream = null;
  this.getLocalStream = function( ) {
    return localStream;
  };
  this.setLocalStream = function ( stream ) {
    localStream = stream;
  }; 

  var localVideo = null;
  this.getLocalVideo = function( ) {
    return localVideo;
  };
  this.setLocalVideo = function ( video ) {
    localVideo = video;
  };

  var remoteVideo = null;
  this.getRemoteVideo = function( ) {
    return remoteVideo;
  };
  this.setRemoteVideo = function ( video ) {
    remoteVideo = video;
  }; 

  var remoteAudio = null;
  this.getRemoteAudio = function( ) {
    return remoteAudio;
  };
  this.setRemoteAudio = function ( audio ) {
    remoteAudio = audio;
  }; 

  var callState = {
    'uninit': -1,
    'idle': 0,
    'remoteConnecting': 1,
    'remoteRinging': 2,
    'localRinging': 3,
    'localConnecting': 4,
    'connected': 5,
    'mediaEstablished': 6,
    'hold': 7,
    'disconnecting': 8
  };

  var currentCallState = 0;

  this.getState = function( name ) {
    return callState[ name ];
  }; 

  this.getCurrentState = function () {
    return currentCallState;
  };

  this.setState = function ( state ) {
    currentCallState = state;
  }; 

  var callMap = {};
  this.setInSdp = function ( id, msg ) {
    if ( id && msg ) {
      callMap[ id ] = msg;  
    }
  };

  this.getInSdp = function ( id ) {
    if ( id ) {
      return callMap[ id ];
    }
  }; 

  this.callMapSz = function ( ) {
    return Object.keys(callMap).length;
  };

  onRegOkDefCb = function( ) {
    console.log("onRegOkDefCb: Invoking default handler");
  };


  onRegFailDefCb = function( ) {
    console.log("onRegFailDefCb");
  };

  onRingingDefCb = function( ) {
    console.log("onRingingDefCb");
  };

  onConnectedDefCb = function( ) {
    console.log("onConnectedDefCb");
  };

  onHangupDefCb = function( error ) {
    console.log("onHangupDefCb error: " + error);
  };

  onDisconnectDefCb = function( error ) {
    console.log("onDisconnectDefCb error: " + error);
  };

  onUserMediaDefCb = function( ) {
    console.log("onUserMediaDefCb");
  };

  onUserMediaFailDefCb = function( error ) {
    console.log("onUserMediaFailDefCb error: " + error);
  };

  onRemoteStreamDefCb = function( ) {
    console.log("onRemoteStreamDefCb");
  };

  onInfoDefCb = function( contentType, content ) {
    console.log("onInfoDefCb contentType: " + contentType + " content: " + content);
  };

  onMessageDefCb = function( remoteUri, contentType, content ) {
    console.log("onMessageDefCb remoteUri: " + remoteUri + " contentType: " + contentType + " content: " + content);
  };

  onDeregisterDefCb = function( ) {
    console.log("onDeregisterDefCb"); 
  };

  var userCb = {
    'onRegisterOk': null,
    'onRegisterFail': onRegFailDefCb,
    'onRinging': onRingingDefCb,
    'onConnected': onConnectedDefCb,
    'onInCall': null,
    'onHangup': onHangupDefCb,
    'onDisconnect': onDisconnectDefCb,
    'onUserMediaOk': onUserMediaDefCb,
    'onUserMediaFail': onUserMediaFailDefCb,
    'onRemoteStreamOk': onRemoteStreamDefCb,
    'onMessage': onMessageDefCb,
    'onInfo': onInfoDefCb,
    'onDeregister': onDeregisterDefCb
  };

  this.setUserCb = function( name, handler ) {
    userCb[ name ] = handler;
  };

  this.getUserCb = function( name ) {
    return userCb[ name ];
  };

  this.onDisconnecting = function ( ) {
    this.setState(this.getState('disconnecting'));
    this.cleanSession();
    this.getUserCb('onDisconnect')( );
    this.stateTransition(this.getState('idle'));
  };
}

/**
 * set callback handlers.
 * @return {void}
 */
Dialogic.prototype.setHandlers = function( handlers ) {
  if ( typeof handlers !== 'object' ) {
    console.log("bad args in setHandlers");
    return 'error_bad_args';
  }
  var ret = 'ok';
  var name;
  for ( name in handlers ) {
    if ( handlers.hasOwnProperty( name ) ) {
      if ( name && handlers [ name ] && typeof handlers [name] === 'function' ) {
        if ( name === 'onRegisterOk' ||
            name === 'onRegisterFail' ||
            name === 'onRinging' ||
            name === 'onConnected' ||
            name === 'onInCall' ||
            name === 'onHangup' ||
            name === 'onDisconnect' ||
            name === 'onUserMediaOk' ||
            name === 'onUserMediaFail' ||
            name === 'onRemoteStreamOk' ||
            name === 'onMessage' ||
            name === 'onInfo'  ||
            name === 'onDeregister' 
           ) {
          console.log("Setting handler: " + name);
          this.setUserCb( name, handlers [name] );
        } else {
          console.log("wrong callback name provided " + name);
          ret = 'error_bad_args';
          break;
        }
      }
    }
  }
  return ret;
};

/**
 * register web user with xms.
 * @return {'ok', 'error_bad_args'} 
 */
Dialogic.prototype.register = function( userName, wsUrl ) {
  if ( !userName || !wsUrl ) {
    console.log("Register user: error_null_args");
    return 'error_bad_args';
  }
  if ( wsUrl.search("ws://") === 0 ||  wsUrl.search("wss://") === 0 ) {
    this.userName = "rtc:" + userName;
    console.log("Register user: " + this.userName);
    this.webServerURL = wsUrl;
    this.initBrowser();
    this.openChannel();
    return 'ok';
  }
  console.log("Register user: error_bad_args");
  return 'error_bad_args';
};

/**
 * Initialization
 * @return {'ok', 'error_user_unregistered', 'error_bad_args', error_not_permitted} 
 */
Dialogic.prototype.initialize = function( config ) {
  if ( this.userRegistered === false ) {
    console.log("initialize. error: unregistered user.");
    return 'error_user_unregistered';
  }
  console.log("initialize called.");

  if ( this.getCurrentState() !==  this.getState('uninit') ) {
    console.log("error: initialize api called in invalid state: " + this.getCurrentState());
    return 'error_not_permitted';
  }

  if ( typeof config !== 'object' ) {
    console.log("initialize. config bad args");
    return 'error_bad_args';
  }
  var ret = 'ok';
  var name;
  for ( name in config ) {
    if ( config.hasOwnProperty(name) ) {
      if ( name && typeof config[ name ] === 'object' ) {
        if ( name === 'localVideo' ) {
          if ( config[ name ] ) {
            if ( config[ name ].nodeName === 'VIDEO' ) {
              console.log("setting lv");
              this.setLocalVideo(config[ name ]);
            } else {
              console.log("initialize. wrong localVideo config: " + config[ name ] );
              ret = 'error_bad_args';
              break;
            }
          }
        }
        else if ( name === 'remoteVideo' ) {
          if ( config[ name ] ) {
            if ( config[ name ].nodeName === 'VIDEO' ) {
              console.log("setting rv");
              this.setRemoteVideo(config[ name ]);
            } else {
              console.log("initialize. wrong remoteVideo config: " + config[ name ] );
              ret = 'error_bad_args';
              break;
            }
          }
        }
        else if ( name === 'remoteAudio' ) {
          if ( config[ name ] ) {
            if ( config[ name ].nodeName === 'AUDIO' ) {
              console.log("setting ra");
              this.setRemoteAudio(config[ name ]);
            } else {
              console.log("initialize. wrong remoteAudio config: " + config[ name ] );
              ret = 'error_bad_args';
              break;
            }
          }
        } else {
          console.log("initialize. wrong config object: " + name  +  " value " + config[ name ]);
          ret = 'error_bad_args';
          break;
        }
      }
      else {
        console.log("initialize. wrong config object: " + config);
        ret = 'error_bad_args';
        break;
      }
    }
  }
  if ( ret === 'ok' ) {
    this.stateTransition(this.getState('idle'));
  } 
  return ret;
};

/**
 * Detect the type of Browser
 * Adjust the functon calls accordingly
 * @return {void}
 */
Dialogic.prototype.initBrowser = function( ) {
  this.RTCPeerConnection = null;
  this.getUserMedia = null;
  this.attachMediaStream = null;

  if ( navigator.mozGetUserMedia ) {
    console.log("This is Firefox.");
    this.isFirefox = true;
    this.RTCPeerConnection = mozRTCPeerConnection;
    this.RTCSessionDescription = mozRTCSessionDescription;
    this.RTCIceCandidate = mozRTCIceCandidate;

    this.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
    this.attachMediaStream = function(element, stream) {
      console.log("Attaching media stream.");
      element.mozSrcObject = stream;
      element.play();
    };
  } else if ( navigator.webkitGetUserMedia ) {
    console.log("This is Chrome.");
    this.isChrome = true;
    this.RTCPeerConnection = webkitRTCPeerConnection;
    this.RTCSessionDescription = RTCSessionDescription;
    this.RTCIceCandidate = RTCIceCandidate;

    this.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    this.attachMediaStream = function(element, stream) {
      element.src = webkitURL.createObjectURL(stream);
    };
  } else {
    console.log("Browser does not appear to be WebRTC-capable");
  }
};

/**
 * Declare the socket (websocket) and open it
 * declare the event attached to the socket
 * @return {void}
 */
Dialogic.prototype.openChannel = function( ) {
  if ( location.search.substring(1,5) === "room" ) {
    this.room = location.search.substring( 6 );
    this.guest = 1;
  }
  this.socket = new WebSocket(this.webServerURL, "rtcweb");
  this.socket.onopen = this.onChannelOpened.bind(this);
  this.socket.onmessage = this.onChannelMessage.bind(this);
  this.socket.onclose = this.onChannelClosed.bind(this);
};

/**
 * acquire the media (audio or video) of the user
 * @return {void}
 */
Dialogic.prototype.acquireLocalMedia = function ( constraints ) {
  if ( this.userRegistered === false ) {
    console.log("acquireLocalMedia, unregistered user");
    return 'error_user_unregistered';
  }
  if ( typeof constraints !== 'object' ) {
    console.log("bad args in acquireLocalMedia");
    return 'error_bad_args';
  }
  if ( this.getCurrentState() ===  this.getState('uninit') ) {
    console.log("error: acquireLocalMedia api called in uninitialized state.");
    return 'error_not_permitted';
  }
  console.log("acquireLocalMedia api called with mediaConstraints: " + JSON.stringify(constraints));
  var ret = 'ok';
  var name;
  for ( name in constraints ) {
    if ( constraints.hasOwnProperty(name) ) {
      if ( name && typeof constraints[ name ] === 'boolean' ) {
        if ( name === 'audio' ) {
        } else if ( name === 'video' ) {
          if ( constraints[ name ] ) {
            constraints[ name ] = {'mandatory': {}, 'optional': []};
          } 
        } else {
          console.log("acquireLocalMedia. Invalid media constraints: " + JSON.stringify(constraints));
          ret = 'error_bad_args';
          break;
        }
      } else {
        console.log("acquireLocalMedia. Invalid media constraints: " + JSON.stringify(constraints));
        ret = 'error_bad_args';
        break;
      }
    }
  }
  if ( ret === 'ok' ) {
    this.obtainMedia(constraints);
  }
  return ret;
};

/**
 * get the media (audio or video) of the user
 * @return {void}
 */
Dialogic.prototype.obtainMedia = function ( mediaConstraints ) {
  try {
    this.getUserMedia(mediaConstraints, this.onUserMediaSuccess.bind(this), this.onUserMediaError.bind(this));
    console.log("Requested access to local media with media constraint: \"" + JSON.stringify(mediaConstraints) + "\".");
  } catch ( e ) {
    try {
      mediaConstraints = "video,audio";
      this.getUserMedia(mediaConstraints, this.onUserMediaSuccess.bind(this), this.onUserMediaError.bind(this));
      console.log("Requested access to local media with old syntax: " + mediaConstraints);
    } catch ( e ) {
      alert("getUserMedia() failed. Is the MediaStream flag enabled in about:flags?");
      console.log("getUserMedia failed with exception: " + e.message);
    }
  }
};

/**
 * Callback function for obtainMedia() on success getting the media
 * create an url for the current stream
 * @param  {stream} stream : contains the video and/or audio streams
 * @return {void}
 */
Dialogic.prototype.onUserMediaSuccess = function( stream ) {
  console.log("User has granted access to local media.");
  var localStream = this.getLocalStream();
  var localVideo = this.getLocalVideo();
  if ( localStream === null ) {
    if ( localVideo ) {
      localVideo.muted = "true";
      this.setLocalVideo(localVideo);
      this.attachMediaStream(localVideo, stream);
    } else {
      console.log("localVideo html null");
    }
    this.getUserCb('onUserMediaOk')();
    this.setLocalStream(stream);
  }
  if ( this.guest ) {
    this.connectStart(); 
  }   
};

/**
 * Callback function for obtainMedia() media fail.
 * @param  {error} error : error info.
 * @return {void}
 */
Dialogic.prototype.onUserMediaError = function( error ) {
  var err = error.code ? error.code : "user media access fail";
  console.log("Failed to get access to local media. Error: " + err);
  this.getUserCb('onUserMediaFail')(err);
};

/**
 * Create peer connection and add local stream to it.
 * @return {bool}
 */
Dialogic.prototype.connectStart = function( ) {
  var localStream = this.getLocalStream();
  if ( !this.started && this.channelReady ) {
    console.log("Creating PeerConnection.");
    this.pc = this.createPeerConnection();  
    console.log("Adding local stream.");
    if ( localStream ) {
      this.pc.addStream(localStream);
    }
    this.started = true;
    if ( this.guest ) {
      this.doCall(this.pc);
    }
    return true;
  } else {
    console.log("call cannot be made. is network access ok ?");
    return false;
  }
};

/**
 * Set parameter for creating a peer connection.
 * @return {peer connection object.}
 */
Dialogic.prototype.createPeerConnection = function() {
  // Chrome likes to explicitly be given a STUN server address.
  // FF internally has an address for one (media.peerconnection.default_iceservers) and does not appreciate being given one.
  var pc_config = this.isChrome ? { "iceServers": [{"url": "stun:stun.l.google.com:19302"}] } : null;
  // Save this as an example of a TURN server being  used
  //var pc_config = {"iceServers": [{"url": "turn:username@ip:3478", "credential": "userpassword"}]};
  var pc_constraints = { "optional": [{"DtlsSrtpKeyAgreement": true}] };
  var pc_new = null;
  try {
    pc_new = new this.RTCPeerConnection(pc_config, pc_constraints);
    pc_new.onicecandidate = this.onIceCandidate.bind(this);
    console.log("Created webkitRTCPeerConnnection with config \"" + JSON.stringify(pc_config) + "\".");
  } catch ( e ) {
    console.log("Failed to create PeerConnection, exception: " + e.message);
    alert("Cannot create PeerConnection object; Is the 'PeerConnection' flag enabled in about:flags?");
    return;
  }
  pc_new.onconnecting = this.onSessionConnecting;
  pc_new.onopen = this.onSessionOpened;
  pc_new.onaddstream = this.onRemoteStreamAdded.bind(this);
  pc_new.onremovestream = this.onRemoteStreamRemoved;  

  return pc_new;
};

/**
 * send a message to peer.
 * @param  {message} message : message to be sent accross.
 * @return {void}
 */
Dialogic.prototype.sendWebSocketMessage = function( message ) {
  var msgStr = JSON.stringify(message);
  if ( this.channelReady === true ) {
    console.log('C->S: ' + msgStr);
    this.socket.send(msgStr);
  } else {
    console.log("channel not ready. not sending " + msgStr);
  }
};

Dialogic.prototype.setLocalSDP = function( sessionDescription ) {
  var cur_pc = this.pc;
  var wmsg;
  console.log("Callback from media engine, SDP received");
  if ( this.isCaller ) {
    wmsg = { type : "tryCall", name: this.userToCall, sdp: sessionDescription, contentType: "", content: "" };
    cur_pc.setLocalDescription(sessionDescription);
    this.sendWebSocketMessage(wmsg);
  } else if ( this.isCallee ) {
    var contentType = this.callOfferMsg.contentType ? this.callOfferMsg.contentType : ""; 
    var content = this.callOfferMsg.contentType ? this.callOfferMsg.content : ""; 
    wmsg = { type: "inCallOfferResp", 
      result: "ACCEPTED", 
      sdp: sessionDescription, 
      localUri: this.callOfferMsg.localUri, 
      remoteUri: this.callOfferMsg.remoteUri,
      contentType: contentType,
      content: content
    };
    cur_pc.setLocalDescription(sessionDescription);
    this.sendWebSocketMessage(wmsg);
    if ( this.callOfferMsg.sdp.sdp ) {
      this.stateTransition(this.getState('connected'));
    }
  } else {
    cur_pc.setLocalDescription(sessionDescription);
  }
};

Dialogic.prototype.createAnswerFailed = function( error ) {
  if ( this.isChrome ) {
    console.log('Failed to create answer: ' + error.toString());
  } else {
    console.log('Failed to create answer: ' + error.name);
  }
  this.onCallHangup('error_internal');
};

Dialogic.prototype.createOfferFailed = function( error ) {
  if ( this.isChrome ) {
    console.log('Failed to create offer: ' + error.toString());
  } else {
    console.log('Failed to create offer: ' + error.name);
  }
  this.onCallHangup('error_internal');
};

Dialogic.prototype.doCall = function( pcn ) {
  console.log("doCall::Sending offer to peer with sdp constraints: " + JSON.stringify(this.sdpConstraints));
  pcn.createOffer(this.setLocalSDP.bind(this), this.createOfferFailed.bind(this), this.sdpConstraints);
};

Dialogic.prototype.doAnswer = function( pcn ) {
  console.log("doAnswer::Sending answer to peer.");
  pcn.createAnswer(this.setLocalSDP.bind(this), this.createAnswerFailed.bind(this), this.sdpConstraints);
};

Dialogic.prototype.processSignalingMessage = function( pcn, msg ) {
  if ( msg.type === 'offer' ) {
    console.log("processSignalingMessage: Processing offer");
    pcn.setRemoteDescription(new this.RTCSessionDescription(msg));
    this.doAnswer(pcn);
  } else if ( msg.type === 'answer' && this.started ) {
    console.log("processSignalingMessage: Processing answer");
    pcn.setRemoteDescription(new this.RTCSessionDescription(msg));
  } else if ( msg.type === 'candidate' && this.started ) {
    var candidate = new this.RTCIceCandidate({sdpMLineIndex:msg.label, candidate:msg.candidate});
    pcn.addIceCandidate(candidate);
  }
};

Dialogic.prototype.onIceCandidate = function( event ) {
  if ( event.candidate ) {
    console.log("onIceCandidate: label: " + event.candidate.sdpMLineIndex + " id: " + event.candidate.sdpMid + " candidate: " + event.candidate.candidate);
    this.sendWebSocketMessage({ type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate });
  } else {
    if ( this.isChrome === true ) {
      console.log("End of candidates.");
      var wmsg = { type: "nullice" };
      this.sendWebSocketMessage(wmsg);
    }
  }
};

/**
 * Called when the channel with the server is opened
 * if you're the guest the connection is establishing by calling connectStart()
 * @return {void}
 */
Dialogic.prototype.onChannelOpened = function( ) {    
  console.log('Channel opened.');
  this.channelReady = true;

  var wmsg = { type: "register", userName: this.userName };
  this.sendWebSocketMessage(wmsg);

  if ( this.guest ) {
    this.connectStart();
  }
};

/**
 * Called when the client receive a message from the websocket server
 * @param  {message} message : SDP message
 * @return {void}
 */
Dialogic.prototype.onChannelMessage = function( message ) {
  console.log('S->C: Type: ' + message.type + ' Data: ' + message.data);
  var wmsg;

  if ( message.type === "message" ) {
    var msg = JSON.parse(message.data);
    if ( msg.type === 'room' ) {
      if ( this.guest ) {
        console.log("guest");
        wmsg = { type: "room", roomId: this.room };
        this.sendWebSocketMessage(wmsg);
      } else {
        this.room = msg.id;
      }
    } else if ( msg.type === 'inCallOffer' ) {
      console.log("inCallOffer from user: " + msg.localUri);
      // todo: save offer message. see state before overwriting
      this.callOfferMsg = msg;
      var ret = this.stateTransition(this.getState('localRinging'));
      if ( !ret ) {
        console.log("state transition to local ringing denied");
      }
    } else if ( msg.type === 'tryCallResp' ) {
      if ( msg.result === 'RINGING' ) {
        console.log("tryCall for user: " + msg.userName + " succeeded");
        this.stateTransition(this.getState('remoteRinging'));
      } else {
        console.log("tryCall for user: " + msg.userName + " failed with " + msg.result);
        this.onCallHangup(msg.result);
      }
    } else if ( msg.type === 'ackAnswer' ) {
      console.log("ackAnswer from user " + msg.localUri + " is: " + msg.result);
      if ( msg.result === 'ACCEPTED' ) {
        if ( !(msg.sdp.sdp ) ) {
          console.log("no sdp received in ackAnswer");
        } else {
          this.processSignalingMessage(this.pc, msg.sdp);
          this.stateTransition(this.getState('connected'));
        }
      } else {
        this.onCallHangup('error_bad_answer');
      }
    } else if ( msg.type === 'inCallOfferResp' ) {
      console.log("inCallOfferResp from user " + msg.fromName + " is: " + msg.result);
      if ( msg.result === "ACCEPTED" ) {
        this.processSignalingMessage(this.pc, msg.sdp);
        this.stateTransition(this.getState('connected'));
      } else {
        this.onCallHangup('error_bad_answer');
      }
    } else if ( msg.type === "answerAck" ) {
      console.log("answerAck received.");
    } else if ( msg.type === "registerAck" ) {
      if ( msg.result === 'register_ok') {
        if ( !this.userRegistered ) {
          this.userRegistered = true;
          this.setState(this.getState('uninit'));
          var wmsg = { type: "nameList" };
          this.sendWebSocketMessage(wmsg);
          this.getUserCb('onRegisterOk')();
        }
      } else if ( msg.result === 'user_already_registered' ) {
        console.log("User: " + msg.user + " already registered ");
        this.getUserCb('onRegisterFail')('RegistrationFailed');
      }
      else {
        console.log("registerAck result: " + msg.result);
      }
    } else if ( msg.type === "nameListResp" ) {
      if ( msg.list.length ) {
        var userNames = msg.list.split("|");
        console.log("NameListResp: Got user list of " + userNames.length + " names: " + userNames);
        updateUserList(userNames);
      } else {
        console.log("NameListResp: Got empty list");
      }
    } else if ( msg.type === "info" ) {
      console.log("Got info message: " + msg);
      this.getUserCb('onInfo')(msg.contentType, msg.content);
    } else if ( msg.type === 'msg' ) {
      this.getUserCb('onMessage')(msg.localUri, msg.contentType, msg.content);
    } else if ( msg.type === 'bye' ) {
      this.onChannelBye(msg);
    } else if ( msg.type === "candidate" ) {
      console.log("ice candidate received from peer");
      this.processSignalingMessage(this.pc, msg);
    } else if ( msg.type === "nullice" ) {
    } else if ( this.isCaller === false && this.isCallee === false ) {
      this.processSignalingMessage(this.pc, msg);
    } else {
      console.log("unknown message type received: " + msg.type);
    }
  }
};

/**
 * Called when the other client terminates a call
 * @return {void}
 */
Dialogic.prototype.onChannelBye = function( message ) {
  console.log("Call terminated by other party");
  this.onCallHangup(message.reason);
  // cleanup this code
  if ( this.guest ) {
    window.close();
  }
  this.guest = 0;
};

/**
 * log the error
 * @return {void}
 */
Dialogic.prototype.onChannelError = function() {    
  console.log('Channel error.');
};

/**
 * log that the channel is closed
 * @return {[type]}
 */
Dialogic.prototype.onChannelClosed = function() {    
  console.log('Channel closed.');
  this.channelReady = false;
  this.userRegistered = false;
  this.onCallHangup('error_channel_closed');
  this.setState(this.getState('uninit'));
  this.getUserCb('onDeregister')();
};


/**
 * call session hungup
 * @return {void}
 */
Dialogic.prototype.onCallHangup = function( reason ) {
  this.getUserCb('onHangup')(reason);
  this.stateTransition(this.getState('disconnecting'));
};


/**
 * Called when the peer connection is connecting
 * @param  {message} message
 * @return {void}
 */
Dialogic.prototype.onSessionConnecting = function( message ) {
  console.log("Session connecting.");
};

/**
 * Called when the session between clients is established
 * @param  {message} message
 * @return {void}
 */
Dialogic.prototype.onSessionOpened = function( message ) {
  console.log("Session opened.");
};

/**
 * Get the remote stream and add it to the page with an url
 * @param  {event} event : event given by the browser
 * @return {void}
 */
Dialogic.prototype.onRemoteStreamAdded = function( event ) {
  console.log("Remote stream added.");
  if ( !this.remoteMediaAdded ) {
    var remoteMedia;
    remoteMedia = this.callType === 'video' ? this.getRemoteVideo() : this.getRemoteAudio();
    console.log("Attach remoteMedia: " + remoteMedia);
    this.attachMediaStream(remoteMedia, event.stream);
    this.stateTransition(this.getState('mediaEstablished'));
    this.remoteMediaAdded = true;
  }
};

/**
 * Called when the remote stream has been removed
 * @param  {event} event : event given by the browser
 * @return {void}
 */
Dialogic.prototype.onRemoteStreamRemoved = function( event ) {
  console.log("Remote stream removed.");
};


/**
 * Function called by the user to initiate a call
 * @param  {name} : identifier of the called party.
 * @param  {callType} : can take any of the following two values "video", "audio".
 * @return {'ok', 'error_user_unregistered', 'error_bad_args', 'error_internal'} 
 */
Dialogic.prototype.call = function( name, callType ) {
  if ( !name || !callType ) {
    console.log("call api no callee name provided");
    return 'error_bad_args';
  }
  if ( callType !== 'video' && callType !== 'audio' ) {
    console.log("call api. wrong callType provided: " + callType);
    return 'error_bad_args';
  }
  this.callType = callType;
  if ( callType === 'audio' ) {
    this.sdpConstraints = { 'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': false} };
  }
  console.log("Dialogic: Calling " + name);
  this.userToCall = "rtc:" + name;
  if ( this.userRegistered === false ) {
    console.log("call. error: unregistered user.");
    return 'error_user_unregistered';
  }
  var ret = this.stateTransition(this.getState('remoteConnecting'));
  ret = ret ? 'ok' : 'error_internal';
  return ret;
};

/*
 * Cleanup session
 * 
 */
Dialogic.prototype.cleanSession = function( ) {
  this.isCaller = false;
  this.isCallee = false;
  this.userToCall = null;
  this.callType = 'video';
  if ( this.pc !== null ) {
    this.pc.close();
    this.pc = null;
  }
  this.started = false;
  this.remoteMediaAdded = false;
  this.callOfferMsg = {};
};


/**
 * Function called by the user to answer an incoming call.
 * @return {'ok', 'error_user_unregistered', 'error_not_permitted', 'error_internal'} 
 */
Dialogic.prototype.answer = function ( ) {
  if ( this.userRegistered === false ) {
    console.log("error answer. unregistered user");
    return 'error_user_unregistered';
  }
  console.log("answer api called by user");
  return this.stateTransition(this.getState('localConnecting')) ? 'ok' : 'error_not_permitted';
};

/**
 * Function called by the user to hang up and ongoing call
 * Call when the user click on the "Hang Up" button
 * Close the peerconnection and tells to the websocket server you're leaving
 * @return {'ok', 'error_user_unregistered'} 
 */
Dialogic.prototype.hangup = function( reason ) {
  if ( this.userRegistered === false ) {
    console.log("hangup. error: unregistered user");
    return 'error_user_unregistered';
  }
  var state = this.getState();
  if ( state === this.getState('idle') ) {
    console.log("not hanging up in idle state");
    return 'error_not_permitted';
  }
  console.log("called hangup");
  if ( !reason ) {
    reason = "user hungup the call";
  }
  var msg = { 'type': 'bye', 'from': this.userName, 'reason': reason, 'contentType': '', 'content': '' };
  this.sendWebSocketMessage(msg);
  this.stateTransition(this.getState('disconnecting'));
  return 'ok';
};

/**
 * Function called by the user to send a info message.
 * Info message can be sent only after a call is established.
 * @param  {String contentType} : Message content type.
 * @param  {String content} : Message to be sent.
 * @return {'ok', 'error_user_unregistered', 'error_not_permitted', 'error_internal'} 
 */
Dialogic.prototype.sendInfo = function( contentType, content ) {
  if ( this.userRegistered === false ) {
    console.log("sendInfo. error: unregistered user.");
    return 'error_user_unregistered';
  }
  var state = this.getCurrentState();
  if ( state === this.getState('connected') || state === this.getState('mediaEstablished') ) {
    console.log("Dialogic: Sending info: " + content);
    var msg = { type: "info", contentType: contentType, fromName: this.userName, content: content };
    this.sendWebSocketMessage(msg);
    return 'ok';
  }
  console.log("Not sending dtmf message in state: " + state);
  return 'error_not_permitted';
};


/**
 * Send a message asynchronously after registration is success. 
 * This can be called even when a call is not yet established with xms
 * @param  {String destUri} : Message content type.
 * @param  {String contentType} : Message content type.
 * @param  {String content} : Message content.
 * @return {void}
 */
Dialogic.prototype.sendMessage = function( destUri, contentType, content ) {
  if ( this.userRegistered === false ) {
    console.log("sendMessage. error: unregistered user.");
    return 'error_user_unregistered';
  }
  if ( !destUri ) {
    console.logs("sendMessage api bad args destUri");
    return 'error_bad_args';
  }
  console.log("sendMessage: " + content);
  var msg = { type: "msg", localUri: this.userName, remoteUri: destUri, contentType: contentType, content: content };
  this.sendWebSocketMessage(msg);
  return 'ok';
};


/**
 * Function called by the user to send a DTMF digit to signalling server
 * @param  {String dtmfNum} : DTMF digit to be sent. Only one digit should be in each message. Valid digits are: "0123456789*#ABCD" 
 * @param  {Integer dur} : DTMF duration in milliseconds. Default value is 100 milliseconds. 
 * @return {'ok', 'error_user_unregistered', 'error_not_permitted', 'error_internal'} 
 */
Dialogic.prototype.sendDTMF = function( dtmfNum, dur ) {
  if ( this.userRegistered === false ) {
    console.log("sendDTMF. error: unregistered user.");
    return 'error_user_unregistered';
  }
  if ( dtmfNum.length !== 1 ) {
    return 'error_bad_args';
  }
  if ( dtmfNum === '1' ||
      dtmfNum === '2' ||
      dtmfNum === '3' ||
      dtmfNum === '4' ||
      dtmfNum === '5' ||
      dtmfNum === '6' ||
      dtmfNum === '7' ||
      dtmfNum === '8' ||
      dtmfNum === '9' ||
      dtmfNum === '0' ||
      dtmfNum === '*' ||
      dtmfNum === '#' ||
      dtmfNum === 'A' ||
      dtmfNum === 'B' ||
      dtmfNum === 'C' ||
      dtmfNum === 'D' ) {
  } else {
    console.log("sendDTMF error: wrong dtmf digit passed " + dtmfNum);
    return 'error_bad_args';
  }
  var state = this.getCurrentState();
  if ( state === this.getState('connected') || state === this.getState('mediaEstablished') ) {
    var dtmfToneGap = 50;
    dur = ( dur && dur < 1000 ) ? dur : 100;
    var dtmfDuration = String(dur);
    var msg = { type: 'dtmfInfo', fromName: this.userName, digit: dtmfNum, duration: dtmfDuration, tonegap: dtmfToneGap };
    this.sendWebSocketMessage(msg);
    return 'ok';
  }
  console.log("Not sending dtmf message in state: " + state);
  return 'error_not_permitted';
};



Dialogic.prototype.stateTransition = function ( newState ) {
  var ret = true;
  var state = this.getCurrentState();
  if ( !this.userRegistered ) {
    if ( newState !== this.getState('disconnecting') ) {
      console.log("unregistered user: state transition from state: " + state + " to state: " + newState);
      return false;
    }
    if ( state === newState ) {
      console.log("current state equals new state " + newState );
      return true; // todo
    }
  }
  console.log("start state transition from state: " + state + " to state: " + newState);

  switch ( newState ) {
    case this.getState('idle'):
      switch ( state ) {
        case this.getState('uninit') :
        case this.getState('disconnecting') :
        case this.getState('idle') :
          this.setState( newState );
          break;
        default :
          console.log("cannot set idle when present state is: " + state );
          ret = false;
          break;
      }
      break;

    case this.getState('remoteConnecting') :
      switch ( state ) {
        case this.getState('idle') :
          ret = this.connectStart();
          if ( ret ) {
            this.isCaller = true;
            this.doCall(this.pc);
            this.setState( newState );
          }
          break;
        default :
          ret = false;
          break;
      }
      break;

    case this.getState('remoteRinging') :
      switch ( state ) {
        case this.getState('remoteConnecting') :
          this.getUserCb('onRinging')( );
          this.setState( newState );
          break;
        default :
          ret = false;
          break;
      }
      break;

    case this.getState('localRinging') :
      switch ( state ) {
        case this.getState('idle') :
          this.setState( newState );
          this.onCallOffer();
          break;
        default :
          ret = false;
          break;
      }
      break;

    case this.getState('localConnecting') :
      switch ( state ) {
        case this.getState('localRinging') :
          this.setState( newState );
          this.isCallee = true;
          this.connectStart();
          if ( !this.callOfferMsg.sdp.sdp ) {
            console.log("answer() .. generating offer sdp ...");
            this.doCall(this.pc);
          } else {
            if ( this.callOfferMsg.sdp.sdp.search("m=video") === -1 ) {
              this.callType = 'audio';
            } 
            this.processSignalingMessage(this.pc, this.callOfferMsg.sdp);
          }
          break;
        default :
          ret = false;
          break;
      }
      break;

    case this.getState('connected') :
      switch ( state ) {
        case this.getState('localConnecting') :
        case this.getState('remoteRinging') :
        case this.getState('mediaEstablished') : // SS: chrome we have connected after remoteStream for an incoming call
          this.setState( newState );
          this.getUserCb('onConnected')( );
          break;
        default :
          ret = false;
          break;
      }
      break;

    case this.getState('mediaEstablished') :
      switch ( state ) {
        case this.getState('connected') :
        case this.getState('localConnecting') : // SS: w2w call.remote stream calback rxd for callee before answer sdp is generated. so state was localConnecting
          this.setState( newState );
          this.getUserCb('onRemoteStreamOk')();
          break;
        default :
          ret = false;
          break;
      }
      break;

    case this.getState('hold') :
      break;

    case this.getState('disconnecting') :
      this.onDisconnecting();
      break;

    default :
      ret = false;
      break;
  }
  if ( !ret ) {
    console.log("state transition fail from state: " + state + " to state: " + newState);
  }
  return ret;
};

Dialogic.prototype.onCallOffer = function ( ) {
  var wmsg = { 'type': "accept", 'result': "accepted", 'localUri': this.callOfferMsg.localUri, 'remoteUri': this.callOfferMsg.remoteUri };
  this.sendWebSocketMessage(wmsg);
  this.getUserCb('onInCall')(this.callOfferMsg.localUri);
};
