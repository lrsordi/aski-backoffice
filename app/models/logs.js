var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var LogSchema = new Schema({
	type : {type : String, required : true},
	value : {type : String, required : true},
	created_at : {type : Date, required : false, default : Date.now}
});

module.exports = mongoose.model('Log', LogSchema);