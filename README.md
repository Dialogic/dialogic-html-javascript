![alt tag](https://www.dialogic.com/~/media/shared/graphics/video/nwrkfuel-posterimg.jpg)

Dialogic PowerMedia XMS
=======================
Dialogic’s PowerMedia™ XMS is a powerful next-generation software media server that enables standards-based, real-time multimedia communications solutions for mobile and broadband environments. PowerMedia XMS supports standard media control interfaces such as MSML, VXML, NetAnn, and JSR 309, plus a Dialogic HTTP-based version of a RESTful API.


dialogic-html-javascript
========================
Overview: The PowerMedia XMS WebRTC JavaScript API provides functionality to support connecting to and performing media operations on Web Real-Time Communication (WebRTC) compliant devices or endpoints (for example, browsers) with PowerMedia XMS.



Repository Contents
===================
**simpledemo** - sample HTML/JS code for making WebRTC calls using the Dialogic Javascript API. 

Overview: If you are not familiar with web programming or would like to get a demo up and running quickly, refer to the following working example to make a simple outbound WebRTC call. The working example includes both HTML and JavaScript code. Enable the ÒSimple DemoÓ as follows:

1. Save the simpledemo.html to the /var/www/rtcweb/html directory.

2. Save the simpledemo.js to the /var/www/rtcweb/html/js directory.

3. Access the web page using the following URL: http://<xms_ip_address>/rtcweb/simpledemo.html

4. The following figure shows the ÒSimple DemoÓ working example of the web page when using the HTML and JavaScript code.

Make an outbound WebRTC call as follows.
a. Enter the XMS server IP address in the XMS Server IP Address box.
b. Leave the Video Call box checked for a video call or unchecked for audio-only call.
c. Enter any name in the Login Name box.
d. Click Login to register with XMS server. Allow the browser to use microphone and/or camera.

5. All calls will now be either video or audio-only. Refresh the page and log in again to change call media type.

6. In the Name to Call box, enter the same application name as entered in the available WebRTC Verification Demos; play_demo, conf_demo, join_demo, or SIP URI for an outbound SIP call. Refer to the Dialogic¨ PowerMediaª XMS WebRTC Installation and Configuration Guide for more information on using these demos.

7. Click Make Call to initiate the call.

8. Click Hangup when done.


**video_canvas_html5** - Javascript code that used the HTML5 drawImage() method to copy a <video> source to various canvas contexts which could then be manipulated. More info here: http://www.dialogic.com/den/developers/b/developers-blog/archive/2014/08/11/powermedia-xms-html5-canvas-a-better-way-to-hangout.aspx


Useful Links
=============
For more information, visit the PowerMedia XMS WebRTC JavaScript API User's Guide found on in the documents section: http://www.dialogic.com/en/products/media-server-software/xms.aspx

For technical questions, visit our forums:http://www.dialogic.com/den/developer_forums/f/default.aspx


