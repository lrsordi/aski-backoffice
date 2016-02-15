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
var gb = require("./utils/globals");	
var Globals = new gb();

	
// ROUTES FOR OUR API
// =============================================================================
router = express.Router();              // get an instance of the express Router
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

// MODELS
var Media = require(__dirname + "/models/media");
var User = require(__dirname + "/models/user");
var Log = require(__dirname + "/models/logs");


this.Category = require(__dirname + "/models/category");
this.Credit = require(__dirname + "/models/credit");
this.Level = require(__dirname + "/models/level");
this.PaymentMode = require(__dirname + "/models/payment-mode");
this.QuestionInteraction = require(__dirname + "/models/question-interaction");
this.QuestionType = require(__dirname + "/models/question-type");
this.Question = require(__dirname + "/models/question");
this.Rate = require(__dirname + "/models/rate");
this.TimelineItemCategory = require(__dirname + "/models/timeline-item-category");
this.TimelineItem = require(__dirname + "/models/timeline-item");


createMethods(this.Category);
createMethods(this.Credit);
createMethods(this.Level);
createMethods(this.PaymentMode);
createMethods(this.QuestionInteraction);
createMethods(this.QuestionType);
createMethods(this.Question);
createMethods(this.Rate);
createMethods(this.TimelineItemCategory);
createMethods(this.TimelineItem);

// ROUTES
var MediaRouter = require(__dirname + "/routes/media-routes")(router);
var UserRouter = require(__dirname + "/routes/user-routes")(router);




function createMethods(model){
	var name = model.collection.name;

	var ownerBased = model.schema.paths.owner !== undefined;
	router.route('/' + name)
	.get(Globals.isAuthenticated,function(req, res, user){
		console.log(ownerBased);
		mongoose.model(model.modelName).find((ownerBased) ? {owner : req.user._id}: {},function(err,result){
			if(err){
				return res.status(403).json({success : false, message : 'Error on list data.'});
			}
			else{
				return res.status(200).json(result);
			}
		});
	})
	.post(Globals.isAuthenticated,function(req, res, user){
		var nm = mongoose.model(model.modelName)();

		for (var s in req.body){
			nm[s] = req.body[s];
		}

		if(ownerBased){
			nm.owner = req.user._id;
		}

		nm.save(function(err,model){
			if(err){
				return res.status(403).json({success : false, message : 'Error on list data.', error : err});
			}
			else{
				return res.status(200).json(model);
			}
		});
	});

	router.route('/' + name + '/:id')
	.get(Globals.isAuthenticated,function(req, res, user){
		mongoose.model(model.modelName).find((ownerBased) ? {owner : req.user._id,_id:req.params.id}:{_id:req.params.id},function(err,result){
			if(err){
				return res.status(403).json({success : false, message : 'Id not found.'});
			}
			else{
				return res.status(200).json(result);
			}
		});
	})
	.put(Globals.isAuthenticated,function(req, res, user){
		mongoose.model(model.modelName).findOne((ownerBased) ? {owner : req.user._id,_id:req.params.id}:{_id:req.params.id},function(err,model){
			if(err){
				return res.status(403).json({success : false, message : 'Id not found.'});
			}
			else{
				for (var s in req.body){
					if(s !== 'owner')
						model[s] = req.body[s];
				}

				model.save(function(err,model){
					if(err){
						return res.status(403).json({success : false, message : 'Error on save data.', error : err});
					}
					else{
						return res.status(200).end();
					}
				});
			}
		});
	})
	.delete(Globals.isAuthenticated,function(req, res, user){
		mongoose.model(model.modelName).findOne((ownerBased) ? {owner : req.user._id,_id:req.params.id}:{_id:req.params.id},function(err,model){
			if(err){
				return res.status(403).json({success : false, message : 'Id not found.'});
			}
			else{
				model.remove(function(err,model){
					if(err){
						return res.status(403).json({success : false, message : 'Error on delete data.', error : err});
					}
					else{
						return res.status(200).end();
					}
				});
			}
		});
	});






	router.route('/' + name + '/:id/:parameter')
	.get(Globals.isAuthenticated,function(req, res, user){
		mongoose.model(model.modelName).findOne((ownerBased) ? {owner : req.user._id,_id:req.params.id}:{_id:req.params.id},function(err,result){
			if(err){
				return res.status(403).json({success : false, message : 'Id not found.'});
			}
			else{
				var obj = {};
				obj[req.params.parameter] = result[req.params.parameter];
				return res.status(200).json(obj);
			}
		});
	})
	.put(Globals.isAuthenticated,function(req, res, user){
		mongoose.model(model.modelName).findOne((ownerBased) ? {owner : req.user._id,_id:req.params.id}:{_id:req.params.id},function(err,model){
			if(err){
				return res.status(403).json({success : false, message : 'Id not found.'});
			}
			else{
				model[req.params.parameter] = req.body[req.params.parameter];

				model.save(function(err,model){
					if(err){
						return res.status(403).json({success : false, message : 'Error on save data.', error : err});
					}
					else{
						return res.status(200).end();
					}
				});
			}
		});
	});
}


module.exports = {router : router};