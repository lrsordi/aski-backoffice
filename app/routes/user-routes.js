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
var upload_path = __dirname + "/../upload";




function userRoutes(router){

	var Media = require("./../models/media");
	var User = require("./../models/user");
	var Log = require("./../models/logs");
	var gb = require("../utils/globals");	

	var Globals = new gb();

	// USER ROUTER
	//=======================================
	router.route('/user/signup')
	.post(function(req,res){
	  if (!req.body.username || !req.body.password || !req.body.full_name || !req.body.email) {
	    res.json({success: false, msg: 'Please fill in all required fields.'});
	  }	

	  var newuser = new User();
	  newuser.username = req.body.username;
	  newuser.full_name = req.body.full_name;
	  newuser.email = req.body.email;
	  newuser.password = req.body.password;

	  newuser.save(function(err,model){
	  	if(err || !model){
	  		return res.json({message : 'Coud not save this user.', success : false, error_detail : err});
	  	}
	  	else{
	  		res.json(model);
	  	}
	  });
	})

	router.route('/user/signin')
	.post(function(req,res){
		User.findOne({
		    username: req.body.username
		  }, function(err, user) {
		    if (err) throw err;
		 
		    if (!user) {
		      res.send({success: false, message: 'Authentication failed. User not found.'});
		    } else {
		      // check if password matches
		      user.comparePassword(req.body.password, function (err, isMatch) {
		        if (isMatch && !err) {
		          // if user is found and password is right create a token
		          var token = jwt.encode(user, config.secret);
		          // return the information including token as JSON
		          res.json({success: true, token: 'JWT ' + token, model : user});
		        } else {
		          res.send({success: false, message: 'Authentication failed. Wrong password.'});
		        }
		      });
		    }
		  });
	});

	router.route('/user/:id')
	.put(Globals.isAuthenticated,function(req,res){
		User.findOne({_id : req.params.id}, function(err,model){
			if(err || !model){
				return res.json({error : 'id not found.', success : false});
			}
			if(req.params.id.toString() != req.user._id.toString()){
				return res.json({error : 'You have to be the owner.', success : false});
			}

			var valid = model.is_documents_validated;

			for(var s in req.body){
				model[s] = req.body[s];
			}
			model.is_documents_validated = valid;

			Globals.log('user_update_started',JSON.stringify(model));


			model.save(function(err,modelresponse){
				if(err || !model){
					return res.status(403).json({success : false, message : 'Could not save this data.'});
				}

				// validate image...
				if(req.body.document_image_id && !model.is_documents_validated){
					Globals.log('user_start_validate_image',JSON.stringify(model));

					validateDocumentImage(req.body.document_image_id,modelresponse.full_name, function(success,msg){
						if(!success){
							Globals.log('user_error_validate_image',msg);
							res.status(403).json({success : success, message :msg});
						}
						else{
							Globals.log('user_success_validate_image',msg);
							model.is_documents_validated = true;
							model.save(function(err,resp){

								if(req.body.picture_id && !model.is_picture_validated){
									validatePicture(req.body.picture_id, model,res);
								}
								else{
									res.status(200).end();
								}
							});	
						}
					});
				}
				else
				{
					if(req.body.picture_id && !model.is_picture_validated){
						validatePicture(req.body.picture_id, modelresponse, res);
					}
					else{
						res.status(200).end();
					}
					
				}
			});
		});	
	});


	function validatePicture(id, modeluser, res){
		Media.findOne({_id : id}, function(err,model){
			if(err || !model){
				res.status(403).json({success : false, message :'Image not found'});
				return;
			}
			else{
				var req = unirest("POST", "https://api.havenondemand.com/1/api/sync/detectfaces/v1");
				req.attach("file",__dirname + model.path);
				req.field("apikey","9635d492-1715-47f2-8e55-7a4959526aa0");

				req.end(function(response){
					var faces = response.body.face.length;
					if(faces > 0){
						modeluser.is_picture_validated = true;
						console.Globals.log(modeluser);
						modeluser.save(function(err,model){
							res.status(200).end();
						});
					}
					else{	
						res.status(403).json({success : false, message :'There is no faces in this image.'});
					}
				});		
			}
		});	
	}


	function validateDocumentImage(id,fullname,cb){
		Media.findOne({_id : id}, function(err,model){
			if(err || !model){
				cb(false, 'Document image not found.');
				return;
			}
			else{
				var req = unirest("POST", "http://api.imagga.com/v1/content");

				req.attach('file',__dirname + model.path);
				req.headers({
				  "authorization": "Basic YWNjXzlkYTkyZjU5YzJkNDc5NjpmMmFiYTVhYmE2OGI0ZjAwOGNmYjRmYzUyNTIxOGNmNw==",
				  "accept": "application/json"
				});
				req.end(function(response){
					if(response.body.status === "uploaded" || response.body.status === "success"){
						var id = response.body.uploaded[0].id;

						var reqtag = unirest("GET", "http://api.imagga.com/v1/tagging");
						reqtag.headers({
						  "authorization": "Basic YWNjXzlkYTkyZjU5YzJkNDc5NjpmMmFiYTVhYmE2OGI0ZjAwOGNmYjRmYzUyNTIxOGNmNw==",
						  "accept": "application/json"
						});					
						reqtag.query({
							content : id
						});
						reqtag.end(function(respo){
							analyzeTags(model,fullname,respo, cb);
						});
					}
					else{
						cb(false, 'Image is not a document.');
					}
				});		
			}
		});
	}


	function analyzeTags(model,fullname,resp, cb){
		if(resp.statusCode !== 200){
			cb(false, 'An error Ocurred.');
			return;
		}

		var tags = resp.body.results[0].tags;
		var score = 0;

		for(var i = 0; i < tags.length; i++){
			if(tags[i].tag === "document" || tags[i].tag === "writing" || tags[i].tag === "paper" || tags[i].tag === "money" || tags[i].tag === "business" || tags[i].tag === "currency"){
				score += tags[i].confidence;
			}
		}

		if(score < 100)
			cb(false,resp.body);
		else
			analyzeText(model,fullname,cb);
	}


	function analyzeText(model,fullname,cb){
		var req = unirest("POST", "https://api.ocr.space/Parse/Image");
		req.attach("file",__dirname + model.path);
		req.field("apikey","helloworld");

		Globals.log('user_start_validate_image_text',fullname);

		req.end(function(res){
			var results = res.body.ParsedResults[0].FileParseExitCode;
			var text = res.body.ParsedResults[0].ParsedText;

			if(results !== 1){
				Globals.log('user_start_validate_image_text',JSON.stringify(res.body));
				cb(false,'Text not found in image.');
			}
			else {
				if(Globals.string_to_slug(text).indexOf(Globals.string_to_slug(fullname)) > -1){
					cb(true);
				}
				else{
					cb(false,'Full name not found in image.');
				}
			}
		});
	}

}


module.exports = userRoutes;