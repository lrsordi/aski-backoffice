var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('fs');
var http = require('http');
var url = require('url');


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
.post(function(req, res){
	var fullUrl = req.protocol + '://' + req.get('host');
	var fullPath;

	upload(req,res,function(err, filename){
		if(err || !req.file){
			return res.json({error : 'Could not save this file.', error_detail : err});
		}
		fullPath = fullUrl + "/upload/" + req.file.originalname;


		var mediaModel = new Media();
		mediaModel.path = "/upload/" + req.file.originalname;
		mediaModel.name = req.file.originalname;
		mediaModel.mimetype = req.file.mimetype;
		mediaModel.extension = path.extname(req.file.originalname);

		mediaModel.save(function(cb1){
			if(err){
				return res.json({error : 'Cloud not insert in database.'});
			}

			return res.json(mediaModel);
		});
	});
});


router.route('/media/:id')
.get(function(req,res){
	var fullUrl = req.protocol + '://' + req.get('host');

	Media.findOne({_id : req.params.id}, function(err,model){
		if(err){
			return res.json({error : 'id not found.'});
		}

		var img = fs.readFileSync(__dirname + model.path);
     	res.writeHead(200, {'Content-Type': model.mimetype });
     	res.end(img, 'binary');
	});
	//
	//res.json()
})
.delete(function(req,res){
	Media.findOne({_id : req.params.id}, function(err,model){
		if(err || !model){
			return res.json({error : 'id not found.'});
		}

		fs.unlink(__dirname + model.path, function(){
			model.remove(function(err,value){
				return res.json({success : 1});
			});
		});
	});	
});



// USER ROUTER
//=======================================
router.route('/user')
.post(function(req,res){

})
.put(function(req,res){

})
.delete(function(req,res){

});




module.exports = {router : router};