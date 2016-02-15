var mongoose	= require('mongoose');
var express 	= require('express');
var multer 		= require('multer');
var path		= require('path');
var bodyParser 	= require('body-parser');
var fs			= require('fs');
var http 		= require('http');
var url 		= require('url');
var jwt         = require('jwt-simple');
var config      = require('../config/database');
var passport	= require('passport');
var unirest		= require('unirest');

var base_path = __dirname;
var upload_path = __dirname + "../upload";


var Media = require(__dirname + "/../models/media");
var User = require(__dirname + "/../models/user");
var Log = require(__dirname + "/../models/logs");


module.exports = function(){

	this.isAuthenticated = function(req,res,next){
		if(passport.authenticate('jwt', { session: false})){
			var token = getToken(req.headers);
			  if (token) {
			    var decoded = jwt.decode(token, config.secret);
			    User.findOne({
			      username: decoded.username
			    }, function(err, user) {
			        if (err) throw err;
			 
			        if (!user) {
			          return res.status(403).send({success: false, message: 'Authentication failed. User not found.'});
			        } else {
			        	req.user = user;
			        	req.result = passport.authenticate('jwt', { session: false});
			          next();
			        }
			    });
			  } else {
			    return res.status(403).send({success: false, message: 'No token provided.'});
			  }
		}
		else{
			return res.status(403).send({success: false, message: 'No token provided.'});
		}
	};



	function getToken(headers) {
	  if (headers && headers.authorization) {
	    var parted = headers.authorization.split(' ');
	    if (parted.length === 2) {
	      return parted[1];
	    } else {
	      return null;
	    }
	  } else {
	    return null;
	  }
	};


	this.string_to_slug = function(str) {
	  str = str.replace(/^\s+|\s+$/g, ''); // trim
	  str = str.toLowerCase();
	  
	  // remove accents, swap ñ for n, etc
	  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
	  var to   = "aaaaeeeeiiiioooouuuunc------";
	  for (var i=0, l=from.length ; i<l ; i++) {
	    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
	  }

	  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
	    .replace(/\s+/g, '-') // collapse whitespace and replace by -
	    .replace(/-+/g, '-'); // collapse dashes

	  return str;
	}

	this.log = function(type,str){
		new Log({type : type, value : str}).save(function(err,model){});
	}
}
