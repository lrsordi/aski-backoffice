// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    	= require('express');        // call express
var app        	= express();                 // define our app using express
var bodyParser 	= require('body-parser');
var router 		= require('./router');
var passport 	= require('passport');
var config      = require('./config/database');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());

var port = process.env.PORT || 8080;        // set our port


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/upload', express.static(__dirname + '/upload'));
app.use('/api', router.router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

// CONNECT TO DATABASE
var mongoose = require('mongoose');
mongoose.connect(config.database);
require('./config/passport')(passport);


