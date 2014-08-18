			$(window).load(function(){
				   var video = $('#remoteVideo')[0]; //variable to tie to our source

				   //create an array to store our canvases
				   var splitCanvas = [$('#c1')[0], $('#c2')[0], $('#c3')[0], $('#c4')[0], $('#c5')[0], $('#c6')[0], $('#c7')[0], $('#c8')[0], $('#c9')[0]];

				   //start the function once the video starts playing
				   video.addEventListener('playing', function () {

					   //create some variables for readability
					   //halving the width and height results in 9 quadrants
					   var w = video.videoWidth / 3.1;
					   var h = video.videoHeight / 3.05;

					   //create a canvas context so we can manipulate the images
					   var context = [];
					   for (var x = 0; x < splitCanvas.length; x++) {
						   //set the canvas dimensions to the native size of the video
						   splitCanvas[x].width = w;
						   splitCanvas[x].height = h;
						   context.push(splitCanvas[x].getContext('2d')); //create the context variables
					   };

					   console.log('drawing');
					   
					   //Draw the 9 quadrants from the source video every 33 ms (approx 30 FPS)
					   setInterval(function () {
						   //context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
						   
						   //Upper left
						   context[0].drawImage(video,
						   0, 0, 			//x, y start clipping
						   w, h, 			//x, y  clipping width
						   0, 0, 			//x, y placement
						   w, h); 			//width, height of placement
						   
						   //Middle left
						   context[1].drawImage(video,
						   0, h,         //x, y start clipping
						   w, h,         //x, y  clipping width
						   0, 0,         //x, y placement
						   w, h);        //width, height of place
						   
						   //Lower left
						   context[2].drawImage(video,
						   0, (h+h), 	    //x, y start clipping
						   w, h, 			//x, y  clipping width
						   0, 0, 			//x, y placement
						   w, h); 			//width, height of place
						   
						   //Upper center
						   context[3].drawImage(video,
						   w, 0, 			//x, y start clipping
						   w, h, 			//x, y  clipping width
						   0, 0, 			//x, y placement
						   w, h); 			//width, height of place
						   
						   //Middle center
						   context[4].drawImage(video,
						   w, h, 			//x, y start clipping
						   w, h,		 	//x, y  clipping width
						   0, 0, 			//x, y placement
						   w, h); 			//width, height of place
						   
						   //Lower center
						   context[5].drawImage(video,
						   w, (h+h), 		//x, y start clipping
						   w, h,  			//x, y  clipping width
						   0, 0, 			//x, y placement
						   w, h); 			//width, height of place				  
						   
						   //Upper right
						   context[6].drawImage(video,
						   (w+w), 0, 		//x, y start clipping
						   w, h, 			//x, y clipping width
						   0, 0, 			//x, y placement
						   w, h); 			//width, height of placement
						   
						   //Middle right
						   context[7].drawImage(video,
						   (w+w), h, 		//x, y start clipping
						   w, h, 			//x, y clipping width
						   0, 0, 			//x, y placement
						   w, h); 			//width, height of placement

						   //Lower right
						   context[8].drawImage(video,
						   (w+w), (h+h), 		//x, y start clipping
						   w, h, 				//x, y  clipping width
						   0, 0, 				//x, y placement
						   w, h); 				//width, height of placement
					   }, 33);
				   });
			});//]]>  