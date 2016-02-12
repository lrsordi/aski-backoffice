var mongoose	= require('mongoose');
var express 	= require('express');
var multer 		= require('multer');
var path		= require('path');
var bodyParser 	= require('body-parser');
var fs			= require('fs');
var http 		= require('http');
var url 		= require('url');
var jwt         = require('jwt-simple');
var config      = require('./config/database');
var passport	= require('passport');
var unirest		= require('unirest');

var base_path = __dirname;
var upload_path = __dirname + "/upload";

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router
// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'Aski! api.' });   
});

var Media = require(__dirname + "/models/media");
var User = require(__dirname + "/models/user");
var Log = require(__dirname + "/models/logs");



function isAuthenticated(req,res,next){
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
}

getToken = function (headers) {
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


















// MEDIA ROUTER
//=======================================
var storage = multer.diskStorage({
	destination : function(req, file, callback){
		callback(null, upload_path);
	},
	filename : function(req, file, callback){
		if(!file){
			return callback(null,false);
		}
		var split = file.originalname.split('.');
		var name = split[0].replace(' ','') + '-' + Date.now() + '.' + split[split.length-1];
		file.originalname = name;
		callback(null, name);
	}
});
var upload = multer({storage : storage, limits : {fieldNameSize : 100, files : 1, fieldSize : 52428800}, fileFilter:function(req,file,cb){
	if(!file){
		return cb('File is empty.', false);
	}
	var ext = path.extname(file.originalname);
    if (ext !== ".mp4" && ext !== ".jpg" && ext !== ".mov") {
      return cb('File type is not allowed (just mp4 and jpg files).',false);
    }
    cb(null,true);
}}).single('file');

router.route('/media')
.post(isAuthenticated,function(req, res, user){
	var fullUrl = req.protocol + '://' + req.get('host');
	var fullPath;

	upload(req,res,function(err, filename){
		if(err || !req.file){
			return res.json({error : 'Could not save this file.', error_detail : err, success : false});
		}
		fullPath = fullUrl + "/upload/" + req.file.originalname;


		var mediaModel = new Media();
		mediaModel.path = "/upload/" + req.file.originalname;
		mediaModel.name = req.file.originalname;
		mediaModel.mimetype = req.file.mimetype;
		mediaModel.extension = path.extname(req.file.originalname);
		mediaModel.owner = req.user._id;

		mediaModel.save(function(cb1){
			if(err){
				return res.json({error : 'Cloud not insert in database.', success : false});
			}

			return res.json(mediaModel);
		});
	});
});


router.route('/media/:id')
.get(isAuthenticated,function(req,res){
	var fullUrl = req.protocol + '://' + req.get('host');

	Media.findOne({_id : req.params.id}, function(err,model){
		if(err || !model){
			return res.json({error : 'id not found.', success : false});
		}

		var img = fs.readFileSync(__dirname + model.path);
     	res.writeHead(200, {'Content-Type': model.mimetype });
     	res.end(img, 'binary');
	});
	//
	//res.json()
})
.delete(isAuthenticated,function(req,res){
	Media.findOne({_id : req.params.id}, function(err,model){
		if(err || !model){
			return res.json({error : 'id not found.', success : false});
		}
		if(model.owner.toString() != req.user._id.toString()){
			return res.json({error : 'You have to be the owner.', success : false});
		}

		fs.unlink(__dirname + model.path, function(){
			model.remove(function(err,value){
				return res.status(200).end();
			});
		});
	});	
});



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
.put(isAuthenticated,function(req,res){
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

		log('user_update_started',JSON.stringify(model));


		model.save(function(err,modelresponse){
			if(err || !model){
				return res.status(403).json({success : false, message : 'Could not save this data.'});
			}

			// validate image...
			if(req.body.document_image_id && !model.is_documents_validated){
				log('user_start_validate_image',JSON.stringify(model));

				validateDocumentImage(req.body.document_image_id,modelresponse.full_name, function(success,msg){
					if(!success){
						log('user_error_validate_image',msg);
						res.status(403).json({success : success, message :msg});
					}
					else{
						log('user_success_validate_image',msg);
						model.is_documents_validated = true;
						model.save(function(err,resp){

							if(req.body.picture_id && !model.is_picture_validated){
								validatePicture(req.body.picture_id, model);
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
					validatePicture(req.body.picture_id, model, res);
				}
				else{
					res.status(200).end();
				}
				
			}
		});
	});	
});


function validatePicture(id, model, res){
	Media.findOne({_id : id}, function(err,model){
		if(err || !model){
			res.status(403).json({success : false, message :'Image not found'});
			return;
		}
		else{
			//return res.status(403).json({success : false, message :__dirname + model.path});

			var req = unirest("POST", "https://api.havenondemand.com/1/api/sync/detectfaces/v1");
			req.attach("file",__dirname + model.path);
			req.field("apikey","9635d492-1715-47f2-8e55-7a4959526aa0");

			req.end(function(response){
				res.status(403).json({success : false, message :response.body});
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

	log('user_start_validate_image_text',fullname);

	req.end(function(res){
		var results = res.body.ParsedResults[0].FileParseExitCode;
		var text = res.body.ParsedResults[0].ParsedText;

		if(results !== 1){
			log('user_start_validate_image_text',JSON.stringify(res.body));
			cb(false,'Text not found in image.');
		}
		else {
			if(string_to_slug(text).indexOf(string_to_slug(fullname)) > -1){
				cb(true);
			}
			else{
				cb(false,'Full name not found in image.');
			}
		}
	});
}


function string_to_slug(str) {
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

function log(type,str){
	new Log({type : type, value : str}).save(function(err,model){});
}



module.exports = {router : router};