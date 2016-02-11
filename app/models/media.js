var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var MediaSchema = new Schema({
	path : {type : String, required : true},
	name : {type : String, required : true},
	mimetype : {type : String, required : true},
	extension : {type : String, required : true},
	created_at : {type : Date, required : false, default : Date.now},
	updated_at : {type : Date, required : false}
});

module.exports = mongoose.model('Media', MediaSchema);