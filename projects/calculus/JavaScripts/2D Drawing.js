/**
 * @author Jialei Li, K.R. Subrmanian, Zachary Wartell
 * 
 * 
 */


/*****
 * 
 * GLOBALS
 * 
 *****/

// 'draw_mode' are names of the different user interaction modes.
//var draw_mode = {DrawLines: 0, DrawTriangles: 1, DrawQuadrilaterals: 2, Delete: 3, ClearScreen: 4, None: 5};
var Functions = {Linear: 1, Quadratic: 2, Cubic: 3, Quartic: 4, Sine: 5, None: 6};

// 'curr_draw_mode' tracks the active user interaction mode
//var curr_draw_mode = draw_mode.DrawLines;
var currFunction = Functions.Linear;
var currMode = "derivative";

// GL array buffers for points, lines, triangles, and quadrilaterals
var vBuffer_Pnt, vBuffer_Line, vBuffer_Quad;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.
var points = [];
var originalPoint = "";

var num_pts_line = 0;	//count number of points clicked for new line
var num_pts_tri = 0;	//count number of points clicked for new triangle
var num_pts_quad = 0;	//count number of points clicked for new quadrilateral

var offset = 200;  //Adjusting grid lines for viewing

/*****
 * 
 * MAIN
 * 
 *****/
function main() {
    
    //math2d_test();
    
    /**
     **      Initialize WebGL Components
     **/
    
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShadersFromID(gl, "vertex-shader", "fragment-shader")) {
        console.log('Failed to intialize shaders.');
        return;
    }

    //create GL buffer object for points
    vBuffer_Pnt = gl.createBuffer();
    if (!vBuffer_Pnt) {
        console.log('Failed to create the buffer object');
        return -1;
    }

	//create GL buffer object for lines
    vBuffer_Line = gl.createBuffer();
    if (!vBuffer_Line) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    //create GL buffer object for triangles
	vBuffer_Tri = gl.createBuffer();
	if(!vBuffer_Line) {
		console.log('Failed to create the buffer object');
		return -1;
	}
	
	//create GL buffer object for quadrilaterals
	vBuffer_Quad = gl.createBuffer();
	if(!vBuffer_Quad) {
		console.log('Failed to create the buffer object');
		return -1;
	}

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // get GL shader variable locations
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    /**
     **      Set Event Handlers
     **
     **  Student Note: the WebGL book uses an older syntax. The newer syntax, explicitly calling addEventListener, is preferred.
     **  See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     **/
    //Sets event handler for the Line button
	document.getElementById("toggleCalculus").addEventListener("click", function() {
		var button = document.getElementById("toggleCalculus");
		if(button.firstChild.data == "View Integrals") {
			document.getElementById("linBtn").style.display="none";
			document.getElementById("quadBtn").style.display="none";
			document.getElementById("cubBtn").style.display="none";
			document.getElementById("quarBtn").style.display="none";
			document.getElementById("sinBtn").style.display="none";
			document.getElementById("derivativeInfo").style.display="none";
			document.getElementById("leftRie").style.display="block";
			document.getElementById("rightRie").style.display="block";
			document.getElementById("integralInfo").style.display="block";
			button.firstChild.data = "View Derivatives";
			drawGrid(gl, canvas, a_Position, u_FragColor);
			drawIntegralFunction(gl, canvas, a_Position, u_FragColor);
			currMode = "integral";
		} else {
			document.getElementById("linBtn").style.display="block";
			document.getElementById("quadBtn").style.display="block";
			document.getElementById("cubBtn").style.display="block";
			document.getElementById("quarBtn").style.display="block";
			document.getElementById("sinBtn").style.display="block";
			document.getElementById("derivativeInfo").style.display="block";
			document.getElementById("leftRie").style.display="none";
			document.getElementById("rightRie").style.display="none";
			document.getElementById("integralInfo").style.display="none";
			button.firstChild.data = "View Integrals";
			drawGrid(gl, canvas, a_Position, u_FragColor);
			currMode = "derivative";
		}
	});
	
    document.getElementById("LinearButton").addEventListener("click", function() {
        currFunction = Functions.Linear;
		console.log("Linear clicked");
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawLinear(gl, canvas, a_Position, u_FragColor);
    });
	
	//Sets event handler for the Triangle button
    document.getElementById("QuadButton").addEventListener("click", function() {
        currFunction = Functions.Quadratic;
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawQuadratic(gl, canvas, a_Position, u_FragColor);
    });    
	
	//Sets event handler for the Triangle button
    document.getElementById("CubicButton").addEventListener("click", function() {
        currFunction = Functions.Cubic;
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawCubic(gl, canvas, a_Position, u_FragColor);
    });
	
	//Sets event handler for the Triangle button
    document.getElementById("QuarticButton").addEventListener("click", function() {
        currFunction = Functions.Quartic;
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawQuartic(gl, canvas, a_Position, u_FragColor);
    });
	
	//Sets event handler for the Triangle button
    document.getElementById("SineButton").addEventListener("click", function() {
        currFunction = Functions.Sine;
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawSine(gl, canvas, a_Position, u_FragColor);
    });
	
	document.getElementById("LeftRiemann").addEventListener("click", function() {
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawLeftRiemann(gl, canvas, a_Position, u_FragColor);
		drawIntegralFunction(gl, canvas, a_Position, u_FragColor);
	});
    
    //Sets event handlers for the red color slider
    document.getElementById("hValue").addEventListener("input", function() {
		document.getElementById('hText').value = document.getElementById('hValue').value / 10;
		updateH(gl, canvas, a_Position, u_FragColor);
    });
	
	//Sets event handlers for the red color slider
    document.getElementById("xValue").addEventListener("input", function() {
		document.getElementById('xText').value = document.getElementById('xValue').value / 100;
		updatePoint(canvas, document.getElementById('xValue').value / 100);
		updateH(gl, canvas, a_Position, u_FragColor);
    });
	
	document.getElementById("aValue").addEventListener("input", function() {
		document.getElementById('aText').value = document.getElementById('aValue').value / 10;
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawLeftRiemann(gl, canvas, a_Position, u_FragColor);
		drawIntegralFunction(gl, canvas, a_Position, u_FragColor);
    });
	
	document.getElementById("distValue").addEventListener("input", function() {
		document.getElementById('distText').value = document.getElementById('distValue').value / 10;
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawLeftRiemann(gl, canvas, a_Position, u_FragColor);
		drawIntegralFunction(gl, canvas, a_Position, u_FragColor);
    });
	
	document.getElementById("nValue").addEventListener("input", function() {
		var numBoxes = document.getElementById('nValue');
		var numBoxesDisplay = document.getElementById('nText');
		if(numBoxes.value != 101) {
			numBoxesDisplay.value = numBoxes.value;
		} else {
			numBoxesDisplay.value = "∞";
		}
		drawGrid(gl, canvas, a_Position, u_FragColor);
		drawLeftRiemann(gl, canvas, a_Position, u_FragColor);
		drawIntegralFunction(gl, canvas, a_Position, u_FragColor);
    });
			
    //Initializes Sliders 
	document.getElementById("hValue").value = 0.0;
	document.getElementById("xValue").value = 0.0;
	document.getElementById("aValue").value = 0.0;
	document.getElementById("distValue").value = 20.0;
	document.getElementById("nValue").value = 1;
            
    // Register function (event handler) to be called on a mouse press
    canvas.addEventListener("mousedown", function (ev) {
        handleMouseDown(ev, gl, canvas, a_Position, u_FragColor);
    });
				
	drawGrid(gl, canvas, a_Position, u_FragColor);
}

/*****
 * 
 * FUNCTIONS
 * 
 *****/

/*
 * Handle mouse button press event.
 * 
 * @param {MouseEvent} ev - event that triggered event handler
 * @param {Object} gl - gl context
 * @param {HTMLCanvasElement} canvas - canvas 
 * @param {Number} a_Position - GLSL (attribute) vertex location
 * @param {Number} u_FragColor - GLSL (uniform) color
 * @returns {undefined}
 */
function handleMouseDown(ev, gl, canvas, a_Position, u_FragColor) {
	if(currMode == "derivative") {
		console.clear();
		var x = ev.clientX; // x coordinate of a mouse pointer
		var y = ev.clientY; // y coordinate of a mouse pointer
		var rect = ev.target.getBoundingClientRect();
		var button = ev.button;	//Holds the value of what mouse button is pressed
		var point;
		var h = document.getElementById('hValue').value;
		points.length = 0;
		
		// convert from canvas mouse coordinates to GL normalized device coordinates
		x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
		switch(currFunction) {
			case Functions.Linear:
				y = x;
				break;
			case Functions.Quadratic:
				y = convertY(canvas, Math.pow(6*x,2));
				break;
			case Functions.Cubic:
				y = convertY(canvas, Math.pow(6*x,3));
				break;
			case Functions.Quartic:
				y = convertY(canvas, Math.pow(6*x,4));
				break;
			case Functions.Sine:
				y = convertY(canvas, Math.sin(6*x));
				break;
		}
		//y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
		
		point = [x,y];
		//points.push(point);
		document.getElementById("xValue").value = x * 600;
		document.getElementById("xText").value = x * 6;
		originalPoint = point;
		console.log("Pre-converted point: [" + ev.clientX + ", " + ev.clientY + "]");
		console.log("Converted point: " + point);
		console.log("Local point: [" + 6*x + ", " + 6*y +"]");
		if(h == 0) {
			points.push([convertX(canvas, 6*x-1), convertY(canvas, 6*y-getDerivative(6*x))]);
			points.push([convertX(canvas, 6*x+1), convertY(canvas, 6*y+getDerivative(6*x))]);
		} else {
			points.push(point);
			points.push(calcH(canvas, x*6));
		}
		console.log("Points: " + points);
		
		//Activates if the left mouse button is pressed
		if(button == 0)	{
			document.getElementById('currPoint').value = "[" + 6*x + ", " + 6*y + "]";
			drawGrid(gl, document.getElementById('webgl'), a_Position, u_FragColor);
			drawPoint(originalPoint, [0.0,1.0,1.0,1.0], gl, canvas, a_Position, u_FragColor);
			if(h != 0) {
				drawPoint(points[1], [1.0,1.0,0.0,1.0], gl, canvas, a_Position, u_FragColor);
			}
			switch(currFunction) {
				case Functions.Linear:
					console.log("Drawing Linear");
					drawLinear(gl, canvas, a_Position, u_FragColor);
					break;
				case Functions.Quadratic:
					console.log("Drawing Quadratic");
					drawQuadratic(gl, canvas, a_Position, u_FragColor);
					break;
				case Functions.Cubic:
					console.log("Drawing Cubic");
					drawCubic(gl, canvas, a_Position, u_FragColor);
					break;
				case Functions.Quartic:
					console.log("Drawing Quartic");
					drawQuartic(gl, canvas, a_Position, u_FragColor);
					break;
				case Functions.Sine:
					console.log("Drawing Sine");
					drawSine(gl, canvas, a_Position, u_FragColor);
					break;
				default:
					console.log("Entering 549 Default with " + currFunction);
					break;
			}
			drawLine(gl, a_Position, u_FragColor);
		}
	}
}

function drawLine(gl, a_Position, u_FragColor) {
	console.log("Drawing line");
	gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);

	gl.drawArrays(gl.LINES, 0, points.length);
}

/*
 * Draw all objects
 * @param {Object} gl - WebGL context
 * @param {Number} a_Position - position attribute variable
 * @param {Number} u_FragColor - color uniform variable
 * @returns {undefined}
 */
/*function drawObjects(gl, a_Position, u_FragColor) {

    //Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
	
	drawGrid(gl, document.getElementById('webgl'), a_Position, u_FragColor);

    //draw lines
    if (line_verts.length) {	
        //enable the line vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        //set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(line_verts), gl.STATIC_DRAW);
        //share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.uniform4f(u_FragColor, lineR/100.0, lineG/100.0, lineB/100.0, 1.0);
        // draw the lines
        gl.drawArrays(gl.LINES, 0, line_verts.length );
    }

   //draw triangles
   if(tri_verts.length)
   {
	   //enable the line vertex
	   gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Tri);
	   //set vertex data into buffer (inefficient)
	   gl.bufferData(gl.ARRAY_BUFFER, flatten(tri_verts), gl.STATIC_DRAW);
	   // share location with shader
	   gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	   gl.enableVertexAttribArray(a_Position);
	   
	   gl.uniform4f(u_FragColor, triR/100.0, triG/100.0, triB/100.0, 1.0);
	   gl.drawArrays(gl.TRIANGLES, 0, tri_verts.length);	// draw the lines
   }
   
   //draw quads
   if(quad_verts.length)
    {
	    for(var i = 0; i < quad_verts.length; i +=4)	//Cycles through the points in the quad_verts array
	    {
			if((quad_verts.length - i - 1) > 4)	//Activates if the current quadrilateral is not the last quadrilateral in the list
			{
				//enable the line vertex
				gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Quad);
				//set vertex data into buffer (inefficient)
				gl.bufferData(gl.ARRAY_BUFFER, flatten(quad_verts.slice(i,i+4)), gl.STATIC_DRAW);
				// share location with shader
				gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(a_Position);
			   
				gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);		// draw the lines
			}
			else	//Activates if the current quadrilateral is the last quadrilateral in the list
			{
				//enable the line vertex
				gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Quad);
				//set vertex data into buffer (inefficient)
				gl.bufferData(gl.ARRAY_BUFFER, flatten(quad_verts.slice(i,quad_verts.length)), gl.STATIC_DRAW);
				// share location with shader
				gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(a_Position);
			   
				gl.uniform4f(u_FragColor, quadR/100.0, quadG/100.0, quadB/100.0, 1.0);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, quad_verts.slice(i,quad_verts.length).length);		// draw the lines
			}	
	    }
    }
    
	if(deleting)	//Gets rid of selected vertices so that theyare no longer drawn
	{
		points.length = 0;
		deleting = false;
	}
	if(lineSelected || triSelected || quadSelected)		//Activates if an object is currently selected
	{
		gl.uniform4f(u_FragColor, 0.0, 0.0, 1.0, 1.0);	//Sets the vertices' color to blue
		if(lineSelected)	//Updates the sliders to represent the lines' color
		{
			document.getElementById("RedRange").value = lineR;
			document.getElementById("GreenRange").value = lineG;
			document.getElementById("BlueRange").value = lineB;
		}
		if(triSelected)//Updates the sliders to represent the triangles' color
		{
			document.getElementById("RedRange").value = triR;
			document.getElementById("GreenRange").value = triG;
			document.getElementById("BlueRange").value = triB;
		}
		if(quadSelected)//Updates the sliders to represent the quagrilaterals' color
		{
			document.getElementById("RedRange").value = quadR;
			document.getElementById("GreenRange").value = quadG;
			document.getElementById("BlueRange").value = quadB;
		}
	}
	else	//Activates is an object is not currently selected
	{
		gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);	//Sets all points to the color white
	}
	
    // draw primitive creation vertices 
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.POINTS, 0, points.length); 
}
*/
/**
 * Converts 1D or 2D array of Number's 'v' into a 1D Float32Array.
 * @param {Number[] | Number[][]} v
 * @returns {Float32Array}
 */
function flatten(v) {
    var n = v.length;
    var elemsAreArrays = false;

    if (Array.isArray(v[0])) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    var floats = new Float32Array(n);

    if (elemsAreArrays) {
        var idx = 0;
        for (var i = 0; i < v.length; ++i) {
            for (var j = 0; j < v[i].length; ++j) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for (var i = 0; i < v.length; ++i) {
            floats[i] = v[i];
        }
    }

    return floats;
}

/*  
 *  Converts a point on x-axis in home-made coordinate space to WebGL's coordinate space
 */
function convertX(canvas, inX) {
	var x = inX + 6;
	
	return ((canvas.offsetLeft - offset + x*50) - canvas.width / 2) / (canvas.width / 2);
}

/*  
 *  Converts a point on y-axis in home-made coordinate space to WebGL's coordinate space
 */
function convertY(canvas, inY) {
	var y = inY + 6;
	return y = (canvas.height / 2 - (canvas.offsetHeight - y*50)) / (canvas.height / 2);
}

function drawGrid(gl, canvas, a_Position, u_FragColor) {
	var x;
    var y;
	var point;
	var gridPoints = [];
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	//Create the vertical lines
	for(var i = 0; i <= 12; i++) {
		x = ((canvas.offsetLeft - offset + i*50) - canvas.width / 2) / (canvas.width / 2);
		y = (canvas.height / 2) / (canvas.height / 2);
		point = [x,y];
		gridPoints.push(point);
		y = (canvas.height / 2 - (canvas.offsetHeight)) / (canvas.height / 2);
		point = [x,y];
		gridPoints.push(point);
		
		//enable the line vertex
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
		//set vertex data into buffer (inefficient)
		gl.bufferData(gl.ARRAY_BUFFER, flatten(gridPoints), gl.STATIC_DRAW);
		//share location with shader
		gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Position);

		if(i == 6) {
			gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
		} else {
			gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
		}
		// draw the lines
		gl.drawArrays(gl.LINES, 0, gridPoints.length);
		
		gridPoints = [];
	}
	
	//Create the horizontal lines
	for(var i = 0; i <= 12; i++) {
		x = ((canvas.offsetLeft - offset) - canvas.width / 2) / (canvas.width / 2);
		y = (canvas.height / 2 - (canvas.offsetHeight - i*50)) / (canvas.height / 2);
		point = [x,y];
		gridPoints.push(point);
		x = ((canvas.offsetLeft - offset + canvas.offsetWidth) - canvas.width / 2) / (canvas.width / 2);
		point = [x,y]
		gridPoints.push(point);
		
		//enable the line vertex
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
		//set vertex data into buffer (inefficient)
		gl.bufferData(gl.ARRAY_BUFFER, flatten(gridPoints), gl.STATIC_DRAW);
		//share location with shader
		gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Position);

		if(i == 6) {
			gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
		} else {
			gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
		}
		// draw the lines
		gl.drawArrays(gl.LINES, 0, gridPoints.length);
		
		gridPoints = [];
	}

	//Test Lines
	/*point = [convertX(canvas, 1, offset),convertY(canvas, 1)];
	console.log("New point: " + point);
	gridPoints.push(point);
	point = [convertX(canvas, 2, offset),convertY(canvas, 2)];
	console.log("New point: " + point);
	gridPoints.push(point);
	
	point = [convertX(canvas, 2, offset),convertY(canvas, 2)];
	console.log("New point: " + point);
	gridPoints.push(point);
	point = [convertX(canvas, 3, offset),convertY(canvas, 4)];
	console.log("New point: " + point);
	gridPoints.push(point);
	
	point = [convertX(canvas, 0.5, offset),convertY(canvas, 0)];
	console.log("New point: " + point);
	gridPoints.push(point);
	point = [convertX(canvas, 2, offset),convertY(canvas, 1.5)];
	console.log("New point: " + point);
	gridPoints.push(point);*/
	
	//Circle
	/*var radius = 2.5;
	for(var i = 0; i <= 360; i++) {
		gridPoints.push([convertX(canvas, radius * Math.cos(i * Math.PI / 180), offset), convertY(canvas, radius * Math.sin(i * Math.PI / 180))]);
	}*/
}

function drawLinear(gl, canvas, a_Position, u_FragColor) {
	var x;
    var y;
	var point;
	var gridPoints = [];
	
	for(var i = -6; i <= 6; i+=0.1) {
		gridPoints.push([convertX(canvas, i), convertY(canvas, i)]);
	}
		
	//enable the line vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
	//set vertex data into buffer (inefficient)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(gridPoints), gl.STATIC_DRAW);
	//share location with shader
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
	// draw the lines
	gl.drawArrays(gl.LINE_STRIP, 0, gridPoints.length);
}

function drawQuadratic(gl, canvas, a_Position, u_FragColor) {
	var x;
    var y;
	var point;
	var gridPoints = [];
	
	for(var i = -6; i <= 6; i+=0.1) {
		gridPoints.push([convertX(canvas, i), convertY(canvas, Math.pow(i,2))]);
	}
		
	//enable the line vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
	//set vertex data into buffer (inefficient)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(gridPoints), gl.STATIC_DRAW);
	//share location with shader
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
	// draw the lines
	gl.drawArrays(gl.LINE_STRIP, 0, gridPoints.length);
}

function drawCubic(gl, canvas, a_Position, u_FragColor) {
	var x;
    var y;
	var point;
	var gridPoints = [];
	
	for(var i = -6; i <= 6; i+=0.1) {
		gridPoints.push([convertX(canvas, i), convertY(canvas, Math.pow(i,3))]);
	}
		
	//enable the line vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
	//set vertex data into buffer (inefficient)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(gridPoints), gl.STATIC_DRAW);
	//share location with shader
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
	// draw the lines
	gl.drawArrays(gl.LINE_STRIP, 0, gridPoints.length);
}

function drawQuartic(gl, canvas, a_Position, u_FragColor) {
	var x;
    var y;
	var point;
	var gridPoints = [];
	
	for(var i = -6; i <= 6; i+=0.1) {
		gridPoints.push([convertX(canvas, i), convertY(canvas, Math.pow(i,4))]);
	}
		
	//enable the line vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
	//set vertex data into buffer (inefficient)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(gridPoints), gl.STATIC_DRAW);
	//share location with shader
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
	// draw the lines
	gl.drawArrays(gl.LINE_STRIP, 0, gridPoints.length);
}

function drawSine(gl, canvas, a_Position, u_FragColor) {
	var x;
    var y;
	var point;
	var gridPoints = [];
	
	for(var i = -6; i <= 6; i+=0.1) {
		gridPoints.push([convertX(canvas, i), convertY(canvas, Math.sin(i))]);
	}
		
	//enable the line vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
	//set vertex data into buffer (inefficient)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(gridPoints), gl.STATIC_DRAW);
	//share location with shader
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
	// draw the lines
	gl.drawArrays(gl.LINE_STRIP, 0, gridPoints.length);
}

function drawPoint(point, colors, gl, canvas, a_Position, u_FragColor) {
	
	//enable the line vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
	//set vertex data into buffer (inefficient)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(point), gl.STATIC_DRAW);
	//share location with shader
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.uniform4f(u_FragColor, colors[0], colors[1], colors[2], colors[3]);
	// draw the lines
	gl.drawArrays(gl.POINTS, 0, 1);
}

function calcH(canvas, x) {
	var h = document.getElementById('hValue').value / 10.0;
	switch(currFunction) {
		case Functions.Linear :
			return [convertX(canvas, x+h), convertY(canvas, x+h)];
			break;
		case Functions.Quadratic:
			return [convertX(canvas, x+h), convertY(canvas, Math.pow(x+h,2))];
			break;
		case Functions.Cubic:
			return [convertX(canvas, x+h), convertY(canvas, Math.pow(x+h,3))];
			break;
		case Functions.Quartic:
			return [convertX(canvas, x+h), convertY(canvas, Math.pow(x+h,4))];
			break;
		case Functions.Sine:
			return [convertX(canvas, x+h), convertY(canvas, Math.sin(x+h))];
			break;
		default:
			console.log("Entering 960 Default with " + currFunction);
			return 0;
			break;
	}
}

function getDerivative(x) {
	switch(currFunction) {
		case Functions.Linear :
			return 1;
			break;
		case Functions.Quadratic:
			return 2 * x;
			break;
		case Functions.Cubic:
			return 3 * Math.pow(x,2);
			break;
		case Functions.Quartic:
			return 4 * Math.pow(x,3);
			break;
		case Functions.Sine:
			return Math.cos(x);
			break;
		default:
			console.log("Entering 983 Default with " + currFunction);
			return 0;
			break;
	}
}

function updatePoint(canvas, x) {
	x = convertX(canvas, x);
	switch(currFunction) {
		case Functions.Linear:
			y = x;
			break;
		case Functions.Quadratic:
			y = convertY(canvas, Math.pow(6*x,2));
			break;
		case Functions.Cubic:
			y = convertY(canvas, Math.pow(6*x,3));
			break;
		case Functions.Quartic:
			y = convertY(canvas, Math.pow(6*x,4));
			break;
		case Functions.Sine:
			y = convertY(canvas, Math.sin(6*x));
			break;
	}
	originalPoint = [x,y];
}

function updateH(gl, canvas, a_Position, u_FragColor) {
	points.length = 0;
	if(originalPoint == "") {
		return;
	}
	var h = document.getElementById('hValue').value / 10.0;
	var x = originalPoint[0] * 6;
	var y = originalPoint[1] * 6;
	if(h == 0) {
		points.push([convertX(canvas, x-1), convertY(canvas, y-getDerivative(x))]);
		points.push([convertX(canvas, x+1), convertY(canvas, y+getDerivative(x))]);
	} else {
		points.push(originalPoint);
		points.push(calcH(canvas, x));
	}
	gl.clear(gl.COLOR_BUFFER_BIT);
	drawGrid(gl, document.getElementById('webgl'), a_Position, u_FragColor);
	switch(currFunction) {
		case Functions.Linear:
			drawLinear(gl, canvas, a_Position, u_FragColor);
			break;
		case Functions.Quadratic:
			drawQuadratic(gl, canvas, a_Position, u_FragColor);
			break;
		case Functions.Cubic:
			drawCubic(gl, canvas, a_Position, u_FragColor);
			break;
		case Functions.Quartic:
			drawQuartic(gl, canvas, a_Position, u_FragColor);
			break;
		case Functions.Sine:
			drawSine(gl, canvas, a_Position, u_FragColor);
			break;
		default:
			console.log("Entering 549 Default with " + currFunction);
			break;
	}
	drawLine(gl, a_Position, u_FragColor);
	drawPoint(originalPoint, [0.0,1.0,1.0,1.0], gl, canvas, a_Position, u_FragColor);
	if(h != 0) {
		drawPoint(points[1], [1.0,1.0,0.0,1.0], gl, canvas, a_Position, u_FragColor);
	}
}

function drawIntegralFunction(gl, canvas, a_Position, u_FragColor) {
	var gridPoints = [];
	
	console.log("drawing integral function");
	
	for(var i = -6; i <= 6; i+=0.1) {
		gridPoints.push([convertX(canvas, i), convertY(canvas, integralFunc(i))]);
	}
		
	//enable the line vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
	//set vertex data into buffer (inefficient)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(gridPoints), gl.STATIC_DRAW);
	//share location with shader
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
	// draw the lines
	gl.drawArrays(gl.LINE_STRIP, 0, gridPoints.length);
}

function drawLeftRiemann(gl, canvas, a_Position, u_FragColor) {
	var a;
	var b;
	var deltaX;
	var n;
	points = [];
	rectPoints = [];
	
	if(document.getElementById('nValue') == 101) {
		drawIntegral(gl, canvas, a_Position, u_FragColor);
	} else {
		console.log("In the else of the Left Riemann");
		a = document.getElementById("aValue").value / 10;
		b = a + document.getElementById("distValue").value / 10;
		n = document.getElementById("nValue").value;
		deltaX = (b-a) / n;
		console.log("A: " + a + "; B: " + b + "; N: " + n + "; dx: " + deltaX);
		for(var i = 0; i < n; i++) {
			//Perimeter
			points.push([convertX(canvas, a + i*deltaX), convertY(canvas, 0)]);
			points.push([convertX(canvas, a + i*deltaX), convertY(canvas, integralFunc(a + i*deltaX))]);
			points.push([convertX(canvas, a + (i+1)*deltaX), convertY(canvas, integralFunc(a + i*deltaX))]);
			
			//Filled-in rectangle
			
			//Note: Would TRIANGLE_STRIP be more optimal?
			rectPoints.push([convertX(canvas, a + i*deltaX), convertY(canvas, 0)]);
			rectPoints.push([convertX(canvas, a + i*deltaX), convertY(canvas, integralFunc(a + i*deltaX))]);
			rectPoints.push([convertX(canvas, a + (i+1)*deltaX), convertY(canvas, integralFunc(a + i*deltaX))]);
			rectPoints.push([convertX(canvas, a + i*deltaX), convertY(canvas, 0)]);
			rectPoints.push([convertX(canvas, a + (i+1)*deltaX), convertY(canvas, integralFunc(a + i*deltaX))]);
			rectPoints.push([convertX(canvas, a + (i+1)*deltaX), convertY(canvas, 0)]);
		}
		points.push([convertX(canvas, b), convertY(canvas, 0)]);
		
		//enable the line vertex
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Quad);
		//set vertex data into buffer (inefficient)
		gl.bufferData(gl.ARRAY_BUFFER, flatten(rectPoints), gl.STATIC_DRAW);
		//share location with shader
		gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Position);
		gl.uniform4f(u_FragColor, 0.0, 1.0, 0.0, 0.25);
		// draw the lines
		gl.drawArrays(gl.TRIANGLES, 0, rectPoints.length);
		
		//enable the line vertex
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
		//set vertex data into buffer (inefficient)
		gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
		//share location with shader
		gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Position);
		gl.uniform4f(u_FragColor, 0.0, 0.0, 1.0, 1.0);
		// draw the lines
		gl.drawArrays(gl.LINE_STRIP, 0, points.length);
	}
}

function drawRightRiemann(gl, canvas, a_Position, u_FragColor) {
	if(document.getElementById('nValue') == 101) {
		drawIntegral(gl, canvas, a_Position, u_FragColor);
	}
}

function drawIntegral(gl, canvas, a_Position, u_FragColor) {
	
}

function integralFunc(x) {
	return Math.sin(3*x+Math.PI/2)+2*Math.cos(x)+1;
}
