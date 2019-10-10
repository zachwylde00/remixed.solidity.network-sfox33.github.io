// PointLightedCube_perFragment.js (c) 2012 matsuda and kanda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  //'  vec4 color = vec4(1.0, 1.0, 1.0, 1.0);\n' + // Sphere color
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = vec4(a_Color);\n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'uniform vec3 u_Emission;\n' +	//Emission light color
  'uniform vec3 u_Specular;\n' + 
  'uniform float u_SpecExponent;\n' + 
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make it 1.0 in length
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
	 // The dot product of the light direction and the normal
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 h = normalize(lightDirection + (-v_Position.xyz));\n' +
  '  float nDotH = max(0.0, pow(dot(normal, h), u_SpecExponent));\n' +
  //'  float vDotR = max(0.0, pow(dot(normalize(-v_Position.xyz), reflect(lightDirection, normal)), u_SpecExponent));\n' +
  '  vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  vec3 emission = u_Emission;\n' +
  '  vec3 specular = vec3(0.8, 0.8, 0.8) * u_Specular * nDotH;\n' + 
  '  gl_FragColor = vec4(diffuse + ambient + emission + specular, v_Color.a);\n' +
  '}\n';
  
var lightAngle = [0.0, 0.0]; // Current rotation angle ([x-axis, y-axis] degrees)
var lightPosVector = new Vector3([0.0, 0.0, 10.0]);	//Holds the position of the light source
var radius = 10.0;	//Radius of the sphere created by the light source

//Holds the translation values for all 96 spheres
var translations = [-5.0, 3.0, -3.0,   -5.0, 3.0, -1.0,   -5.0, 3.0, 1.0,   -5.0, 3.0, 3.0,		//Front Face
					-5.0, 1.0, -3.0,   -5.0, 1.0, -1.0,   -5.0, 1.0, 1.0,   -5.0, 1.0, 3.0,
					-5.0, -1.0, -3.0,  -5.0, -1.0, -1.0,  -5.0, -1.0, 1.0,  -5.0, -1.0, 3.0,
					-5.0, -3.0, -3.0,  -5.0, -3.0, -1.0,  -5.0, -3.0, 1.0,  -5.0, -3.0, 3.0,
					
					-3.0, 3.0, -5.0,   -1.0, 3.0, -5.0,   1.0, 3.0, -5.0,   3.0, 3.0, -5.0,		//Left Face
					-3.0, 1.0, -5.0,   -1.0, 1.0, -5.0,   1.0, 1.0, -5.0,   3.0, 1.0, -5.0,
					-3.0, -1.0, -5.0,  -1.0, -1.0, -5.0,  1.0, -1.0, -5.0,  3.0, -1.0, -5.0,
					-3.0, -3.0, -5.0,  -1.0, -3.0, -5.0,  1.0, -3.0, -5.0,  3.0, -3.0, -5.0,
					
					5.0, 3.0, -3.0,   5.0, 3.0, -1.0,   5.0, 3.0, 1.0,   5.0, 3.0, 3.0,		//Back Face
					5.0, 1.0, -3.0,   5.0, 1.0, -1.0,   5.0, 1.0, 1.0,   5.0, 1.0, 3.0,
					5.0, -1.0, -3.0,  5.0, -1.0, -1.0,  5.0, -1.0, 1.0,  5.0, -1.0, 3.0,
					5.0, -3.0, -3.0,  5.0, -3.0, -1.0,  5.0, -3.0, 1.0,  5.0, -3.0, 3.0,
					
					-3.0, 3.0, 5.0,   -1.0, 3.0, 5.0,   1.0, 3.0, 5.0,   3.0, 3.0, 5.0,		//Right Face
					-3.0, 1.0, 5.0,   -1.0, 1.0, 5.0,   1.0, 1.0, 5.0,   3.0, 1.0, 5.0,
					-3.0, -1.0, 5.0,  -1.0, -1.0, 5.0,  1.0, -1.0, 5.0,  3.0, -1.0, 5.0,
					-3.0, -3.0, 5.0,  -1.0, -3.0, 5.0,  1.0, -3.0, 5.0,  3.0, -3.0, 5.0,
					
					-3.0, 5.0, -3.0,   -3.0, 5.0, -1.0,  -3.0, 5.0, 1.0,  -3.0, 5.0, 3.0,		//Top Face
					-1.0, 5.0, -3.0,   -1.0, 5.0, -1.0,  -1.0, 5.0, 1.0,  -1.0, 5.0, 3.0,
					1.0, 5.0, -3.0,   1.0, 5.0, -1.0,   1.0, 5.0, 1.0,   1.0, 5.0, 3.0,
					3.0, 5.0, -3.0,   3.0, 5.0, -1.0,   3.0, 5.0, 1.0,   3.0, 5.0, 3.0,
					
					-3.0, -5.0, -3.0,   -3.0, -5.0, -1.0,  -3.0, -5.0, 1.0,  -3.0, -5.0, 3.0,		//Bottom Face
					-1.0, -5.0, -3.0,   -1.0, -5.0, -1.0,  -1.0, -5.0, 1.0,  -1.0, -5.0, 3.0,
					1.0, -5.0, -3.0,   1.0, -5.0, -1.0,   1.0, -5.0, 1.0,   1.0, -5.0, 3.0,
					3.0, -5.0, -3.0,   3.0, -5.0, -1.0,   3.0, -5.0, 1.0,   3.0, -5.0, 3.0];
var counter = 0;	//Counter that goes throught the translation array
var er = 0;	//Red emission value
var eg = 0;	//Green emission value
var eb = 0;	//Blue emission value
var ec = 0;	//Total emission value
var rIncrease, gIncrease, bIncrease, cIncrease;		//Booleans to determine when certain spheres (left face) should update their colors

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
	  console.log('Failed to get the storage location of a_Color');
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  var u_Emission = gl.getUniformLocation(gl.program, 'u_Emission');
  var u_Specular = gl.getUniformLocation(gl.program, 'u_Specular');
  var u_SpecExponent = gl.getUniformLocation(gl.program, 'u_SpecExponent');
  if (!u_ModelMatrix || !u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight || !u_Emission || !u_Specular || !u_SpecExponent) { 
    console.log('Failed to get the storage location');
    return;
  }

  // Register the event handler
  var currentAngle = [0.0, 0.0]; // Current rotation angle ([x-axis, y-axis] degrees)
  mouseRotation_initEventHandlers(canvas, currentAngle);
  
  document.onkeydown = function(ev){	//Detecting light position change event handling
	  switch(ev.keyCode)	//Updates the light position depending on what key is pressed
	  {
		  case 73:	//i
			lightAngle[1] += 361.0;
			lightAngle[1] %= 360;		//Adds one degree of rotation
			break;
		  case 74:	//j
			lightAngle[0] += 359.0;
			lightAngle[0] %= 360;		//Subtracts one degree of rotation
			break;
		  case 75:	//k
			lightAngle[1] += 359.0;
			lightAngle[1] %= 360;		//Subtracts one degree of rotation
			break;
		  case 76:	//l
			lightAngle[0] += 361.0;
			lightAngle[0] %= 360;		//Adds one degree of rotation
			break;
		  default:
		    break;
	  }
	  if(ev.keyCode == 73 || ev.keyCode == 75)	//vertical change; x is constant (radius)
	  {
		  if(lightPosVector.elements[0] == 0)
		  {
			lightPosVector.elements[1] = radius * Math.sin((lightAngle[1]/180) * Math.PI);
			lightPosVector.elements[2] = radius * Math.cos((lightAngle[1]/180) * Math.PI);
		  }
		  else
		  {
			var tempRadius = Math.sqrt(Math.pow(radius, 2) - Math.pow(lightPosVector.elements[0], 2));	//calculates the radius of the circle slice when y = 0)
			lightPosVector.elements[1] = tempRadius * Math.sin((lightAngle[1]/180) * Math.PI);		//calculates y value
			lightPosVector.elements[2] = lightPosVector.elements[0] * Math.cos((lightAngle[1]/180) * Math.PI);
			if(lightAngle[1] > 90 && lightAngle[1] < 270)	//Determines whether of not z should be negative
			{
				lightPosVector.elements[2] = 0 - lightPosVector.elements[2];
			}
			if(lightAngle[1] == 90 || lightAngle[1] == 270)
				lightPosVector.elements[2] = 0;
			/* if(lightAngle[0] >= 0 && lightAngle[0] < 180)	//Top half of horizontal circle
			{
				if(lightAngle[1] >= 270 || lightAngle[1] < 90)	//Quadrant I
				{
					lightAngle[0] = (180 * Math.atan(lightPosVector.elements[0]/lightPosVector.elements[2]))/Math.PI;
					console.log("Quad I-y change");
				}
				else	//Quadrant II
				{
					lightAngle[0] = 180 - (180 * Math.asin(lightPosVector.elements[0]/tempRadius))/Math.PI;
					console.log("Quad II-y change");
				}
			}
			else
			{
				if(lightAngle[1] >= 90 && lightAngle[1] < 270)	//Quadrant III
				{
					lightAngle[0] = 180 + (180 * Math.atan(lightPosVector.elements[0]/lightPosVector.elements[2]))/Math.PI;
					console.log("Quad III-y change");
				}
				else	//Quadrant IV
				{
					lightAngle[0] = 360 - (180 * Math.acos(lightPosVector.elements[2]/tempRadius))/Math.PI;
					console.log("Quad IV-y change");
				}
			} */
		  }
	  }
	  if(ev.keyCode == 74 || ev.keyCode == 76)	//Horizontal change; y is constant (radius)
	  {
		  if(lightPosVector.elements[1] == 0)
		  {
			lightPosVector.elements[0] = radius * Math.sin((lightAngle[0]/180) * Math.PI);
			lightPosVector.elements[2] = radius * Math.cos((lightAngle[0]/180) * Math.PI);
		  }
		  else
		  {
			var tempRadius = Math.sqrt(Math.pow(radius, 2) - Math.pow(lightPosVector.elements[1], 2));	//Radius of circle slice
			lightPosVector.elements[0] = tempRadius * Math.sin((lightAngle[0]/180) * Math.PI);		//x coordinate on sphere
			lightPosVector.elements[2] = Math.sqrt(Math.pow(tempRadius, 2) - Math.pow(lightPosVector.elements[0], 2));	//z coordinate on sphere
			if((lightAngle[0] > 90 && lightAngle[0] < 270))	//Calculates whether or not z should be negative
			{
				lightPosVector.elements[2] = 0 - lightPosVector.elements[2];
			}
			if(lightAngle[0] == 90 || lightAngle[0] == 270)
				lightPosVector.elements[2] = 0;
			/* if(lightAngle[1] >= 0 && lightAngle[1] < 180)	//Top of Vertical circle
			{
				if(lightAngle[0] >= 270 || lightAngle[0] < 90)	//Quadrant I
				{
					lightAngle[1] = (180 * Math.atan(lightPosVector.elements[1]/lightPosVector.elements[2]))/Math.PI;
					console.log("Quad I-x change");
				}
				else	//Quadrant II
				{
					lightAngle[1] = 180 - (180 * Math.asin(lightPosVector.elements[1]/tempRadius))/Math.PI;
					console.log("Quad II-x change");
				}
			}
			else
			{
				if(lightAngle[0] >= 270 && lightAngle[0] < 90)	//Quadrant III
				{
					lightAngle[1] = 180 + (180 * Math.atan(lightPosVector.elements[1]/lightPosVector.elements[2]))/Math.PI;
					console.log("Quad III-x change");
				}
				else	//Quadrant IV
				{
					lightAngle[1] = 360 - (180 * Math.acos(lightPosVector.elements[2]/tempRadius))/Math.PI;
					console.log("Quad IV-x change");
				}
			} */
		  }
	  }
	  console.log(lightAngle);
	  console.log(lightPosVector.elements);
	  
	  gl.uniform3f(u_LightPosition, lightPosVector.elements[0], lightPosVector.elements[1], lightPosVector.elements[2]);	//Sets the position of the light source
  };
  
  // Set the light color (white)
  //gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
  //Set the ambient light
  //gl.uniform3f(u_AmbientLight,0.8, 0.8, 0.8);
  // Set the light direction (in the world coordinate)
  //gl.uniform3f(u_LightPosition, lightPosVector.elements[0], lightPosVector.elements[1], lightPosVector.elements[2]);

  var modelMatrix = new Matrix4();  // Model matrix
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals

  var tick = function() {   //Sets up and draws the next animation frame 
	
	//Following chain of if statements applies to the left face of the cube
	if(er <= 0.0 && eg <= 0.0 && eb <= 0.0)	//Determines whether to increase the red emission value
		rIncrease = true;
	if(er >= 1.0)		//Determines if the red emission value should stop increasing and increases the green emission value
	{
		rIncrease = false;
		gIncrease = true;
	}
	if(eg >= 1.0)		//Determines if the green emission value should stop increasing and increases the blue emission value
	{
		gIncrease = false;
		bIncrease = true;
	}
	if(eb >= 1.0)		//Determines if the blue emission value should stop increasing
		bIncrease = false;
	
	if(rIncrease)	//Increases red emission
		er += 0.01;
	else if(gIncrease)	//Increases green emission
		eg += 0.01;
	else if(bIncrease)	//Increases blue emission
		eb += 0.01;
	else		//Decreases emission values
	{
		if(er > 0)
			er -= 0.01;
		else if(eg > 0)
		{
			er = 0.0;
			eg -= 0.01;
		}
		else if(eb > 0)
		{
			eg = 0.0;
			eb -= 0.01;
		}
		if(eb < 0)
			eb = 0.0;
	}
	
  
    // Calculate the model matrix
    modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis (angle, x, y, z)
    // Calculate the view projection matrix
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);	//(fov, aspect ratio, near, far)
    mvpMatrix.lookAt(0, 0, 6, 0, 0, 0, 0, 1, 0);	//((camera)eyeX-Y-Z, ("origin")atX-Y-Z, upX-Y-Z)
    
    mvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // Rotation around x-axis
    mvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Rotation around y-axis       
    
    mvpMatrix.multiply(modelMatrix);
    // Calculate the matrix to transform the normal based on the model matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    // Pass the model matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Pass the model view projection matrix to u_mvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Pass the transformation matrix for normals to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	counter = 0;
	var colors;	//Holds the color values per sphere
	for(var i = 0; i < translations.length; i+=3)		//Determines the propertiesand locations of each sphere
	{
		var n = initVertexBuffers(gl, counter);		//Creates the coordinates for a sphere
		if (n < 0) {
			console.log('Failed to set the vertex information');
			return;
		}
		
		if(counter < 48)	//Front side
		{
			gl.uniform3f(u_LightColor, 0.0, 0.0, 0.0);		//Zero diffuse reflection
			gl.uniform3f(u_Emission, 0.0, 0.0, 0.0);		//Zero emission
			gl.uniform3f(u_Specular, 0.0, 0.0, 0.0);		//Zero Specular Reflection
			
			if(counter == 0 || counter == 12 || counter == 24 || counter == 36)	//Top Row
				gl.uniform3f(u_AmbientLight, 0.0, 0.0, 0.0);
			else if(counter == 3 || counter == 15 || counter == 27 || counter == 39)	//Second Row
				gl.uniform3f(u_AmbientLight, 0.33, 0.33, 0.33);
			else if(counter == 6 || counter == 18 || counter == 30 || counter == 42)	//Third Row
				gl.uniform3f(u_AmbientLight, 0.66, 0.66, 0.66);
			else	//Bottom Row
				gl.uniform3f(u_AmbientLight, 1.0, 1.0, 1.0);
			
			if(counter < 12)	//Fiirst Column
				colors = [1.0, 0.0, 0.0, 1.0];
			else if(counter < 24)	//Sedond Column
				colors = [0.0, 1.0, 1.0, 1.0];
			else if(counter < 36)	//Third Column
				colors = [0.0, 1.0, 0.0, 1.0];
			else	//Fourth Column
				colors = [1.0, 0.0, 1.0, 1.0];
		}
		else if(counter < 96)	//Left Side
		{
			gl.uniform3f(u_AmbientLight, 0.0, 0.0, 0.0);	//Zero default Ambient Light
			gl.uniform3f(u_LightColor, 0.5, 0.5, 0.5);		//Zero default Diffuse Reflection
			gl.uniform3f(u_Emission, 0.0, 0.0, 0.0);		//Zero emission
			gl.uniform3f(u_Specular, 0.0, 0.0, 0.0);		//Zero Specular Reflection
				
			if(counter == 48)	//Top Left
			{
				gl.uniform3f(u_Emission, 0.3, 0.3, 0.3);
				gl.uniform3f(u_AmbientLight, 0.66, 0.66, 0.66);
			}
			else if(counter == 57)	//Top Right
			{
				gl.uniform3f(u_Emission, 0.3, 0.3, 0.3);
				//gl.uniform3f(u_AmbientLight, 0.66, 0.66, 0.66);
			}
			else if(counter == 63)
			{
				gl.uniform3f(u_Emission, er, 0.0, 0.0);
				//gl.uniform3f(u_AmbientLight, 0.66, 0.66, 0.66);
			}
			else if(counter == 66)
			{
				gl.uniform3f(u_Emission, 0.0, eg, 0.0);
				//gl.uniform3f(u_AmbientLight, 0.66, 0.66, 0.66);
			}
			else if(counter == 75)
			{
				gl.uniform3f(u_Emission, er, eg, eb);
				//gl.uniform3f(u_AmbientLight, 0.66, 0.66, 0.66);
			}
			else if(counter == 78)
			{
				gl.uniform3f(u_Emission, 0.0, 0.0, eb);
				//gl.uniform3f(u_AmbientLight, 0.66, 0.66, 0.66);
			}
			else if(counter == 84)	//Bottom Left
			{
				gl.uniform3f(u_Emission, 0.5, 0.5, 0.5);
				gl.uniform3f(u_AmbientLight, 1.0, 1.0, 1.0);
			}
			else if(counter == 93)	//Bottom Right
			{
				gl.uniform3f(u_Emission, 0.5, 0.5, 0.5);
				gl.uniform3f(u_AmbientLight, 1.0, 1.0, 1.0);
			}
			
			if(counter < 60)	//First Column
				colors = [1.0, 0.0, 0.5, 1.0];
			else if(counter < 72)	//Second Column
				colors = [0.0, 0.0, 1.0, 1.0];
			else if(counter < 84)	//Third Column
				colors = [0.0, 0.0, 0.0, 1.0];
			else	//Fourth Column
				colors = [0.5, 0.5, 0.0, 1.0];
		}
		else if(counter < 144)	//Back Side
		{
			colors = [0.75, 0.25, 0.0, 1.0];		//Default color for the back side of the cube of spheres
			gl.uniform3f(u_Emission, 0.0, 0.0, 0.0);		//Zero Emission
			gl.uniform3f(u_Specular, 0.0, 0.0, 0.0);		//Zero Specular
			
			if(counter == 96 || counter == 108 || counter == 120 || counter == 132)		//Top Row
				gl.uniform3f(u_AmbientLight, 1.0, 1.0, 1.0);
			else if(counter == 99 || counter == 111 || counter == 123 || counter == 135)	//Second Row
				gl.uniform3f(u_AmbientLight, 0.66, 0.66, 0.66);
			else if(counter == 102 || counter == 114 || counter == 126 || counter == 138)	//Third Row
				gl.uniform3f(u_AmbientLight, 0.33, 0.33, 0.33);
			else	//Bottom Row
				gl.uniform3f(u_AmbientLight, 0.0, 0.0, 0.0);
			
			if(counter < 108)	//First Column
				gl.uniform3f(u_LightColor, 0.0, 0.0, 0.0);
			else if(counter < 120)	//Second Column
				gl.uniform3f(u_LightColor, 0.33, 0.33, 0.33);
			else if(counter < 132)	//Third Column
				gl.uniform3f(u_LightColor, 0.66, 0.66, 0.66);
			else	//Fourth Column
				gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
		}
		else if(counter < 192)	//Right Side
		{
			gl.uniform3f(u_AmbientLight, 0.0, 0.0, 0.0);	//Zero Ambient Light
			gl.uniform3f(u_Emission, 0.0, 0.0, 0.0);		//Zero emission
			gl.uniform3f(u_Specular, 0.0, 0.0, 0.0);		//Zero Specular Reflection
			
			if(counter == 144 || counter == 156 || counter == 168 || counter == 180)		//Top Row
				gl.uniform3f(u_LightColor, 0.0, 0.0, 0.0);
			else if(counter == 147 || counter == 159 || counter == 171 || counter == 183)	//Second Row
				gl.uniform3f(u_LightColor, 0.33, 0.33, 0.33);
			else if(counter == 150 || counter == 162 || counter == 174 || counter == 186)	//Third Row
				gl.uniform3f(u_LightColor, 0.66, 0.66, 0.66);
			else	//Bottom Row
				gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
			
			if(counter < 156)	//First Column
				colors = [0.75, 0.0, 0.0, 1.0];
			else if(counter < 168)	//Second Column
				colors = [0.0, 0.75, 0.0, 1.0];
			else if(counter < 180)	//Third Column
				colors = [0.0, 0.0, 0.75, 1.0];
			else	//Fourth Column
				colors = [0.25, 0.25, 0.25, 1.0];
		}
		else if(counter < 240)	//Top Side
		{
			gl.uniform3f(u_AmbientLight, 0.0, 0.0, 0.0);	//Zero Ambient Light
			gl.uniform3f(u_LightColor, 0.0, 0.0, 0.0);		//Zero Diffuse Reflection
			gl.uniform3f(u_Emission, 0.0, 0.0, 0.0);		//Zero Emission
			colors = [0.0, 0.0, 0.0, 1.0];	//Default color black
			
			if(counter == 192 || counter == 204 || counter == 216 || counter == 228)		//Left Column
			{
				gl.uniform3f(u_Specular, 1.0, 0.0, 0.0);		//Red Specular Reflection
				gl.uniform1f(u_SpecExponent, 10.0);
			}
			else if(counter == 195 || counter == 207 || counter == 219 || counter == 231)	//Second Column
			{
				gl.uniform3f(u_Specular, 0.0, 1.0, 0.0);		//Green Specular Reflection
				gl.uniform1f(u_SpecExponent, 25.0);
			}
			else if(counter == 198 || counter == 210 || counter == 222 || counter == 234)	//Third Column
			{
				gl.uniform3f(u_Specular, 0.0, 0.0, 1.0);		//Blue Specular Reflection
				gl.uniform1f(u_SpecExponent, 50.0);
			}
			else	//Right Column
			{
				gl.uniform3f(u_Specular, 1.0, 1.0, 1.0);	//White
				gl.uniform1f(u_SpecExponent, 75.0);
			}

			if(lightAngle[1] < 360 && lightAngle[1] > 180 || lightAngle[1] == 0)
				gl.uniform3f(u_Specular, 0.0, 0.0, 0.0);
			
		}
		else	//Bottom Side
		{
			gl.uniform3f(u_AmbientLight, 0.1, 0.1, 0.1);		//Sets the default Ambient Light 
			gl.uniform3f(u_LightColor, 0.1, 0.1, 0.1);			//Sets the default Diffuse Reflection
			gl.uniform3f(u_Emission, 0.0, 0.0, 0.0);		//Zero Emission
			colors = [0.5, 0.5, 0.5, 1.0];		//Default color for the bottom side of the cube of spheres
			
			if(counter == 240 || counter == 252 || counter == 264 || counter == 276)		//Left Column
				gl.uniform3f(u_Specular, 0.1, 0.1, 0.1);
			else if(counter == 243 || counter == 255 || counter == 267 || counter == 279)	//Second Column
				gl.uniform3f(u_Specular, 0.3, 0.3, 0.3);
			else if(counter == 246 || counter == 258 || counter == 270 || counter == 282)	//Third Column
				gl.uniform3f(u_Specular, 0.5, 0.5, 0.5);
			else	//Right Column
				gl.uniform3f(u_Specular, 1.0, 1.0, 1.0);
			
			if(counter < 252)	//First Row
				gl.uniform1f(u_SpecExponent, 128.0);
			else if(counter < 264)	//Second Row
				gl.uniform1f(u_SpecExponent, 64.0);
			else if(counter < 276)	//Third Row
				gl.uniform1f(u_SpecExponent, 16.0);
			else	//Fourth Row
				gl.uniform1f(u_SpecExponent, 8.0);
				
			if(lightAngle[1] >= 0 && lightAngle[1] < 180)
				gl.uniform3f(u_Specular, 0.0, 0.0, 0.0);
				
		}
		
		gl.vertexAttrib4f(a_Color, colors[0], colors[1], colors[2], colors[3]);		//Assigns the color value of the sphere
		gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);		//Draws all of the spheres
		counter += 3;		//Updates the counter to determine the translation values of the sphere being drawn
	}
      
    requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
    };
  tick();   
}

function initVertexBuffers(gl, counter) { // Create a sphere
  var SPHERE_DIV = 13;	//13+
  
  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];
  //Assuming that radius has a length of 1
  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;		//angle forming the jth latitude line
    sj = Math.sin(aj);		//Determines (one of?) the x coordinate of the jth latitude line
    cj = Math.cos(aj);		//Determines the y coordinate of the jth latitude line
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push((si * sj + translations[counter]) * 0.18);  // X
      positions.push((cj + translations[counter + 1]) * 0.18);       // Y
      positions.push((ci * sj + translations[counter + 2]) * 0.18);  // Z
    }
  }

  // Generate indices for the drawElements() fucntion
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3))  return -1;
  
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}
