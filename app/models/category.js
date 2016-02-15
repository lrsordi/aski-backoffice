var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var CategorySchema = new Schema({
	created_at : {type : Date, required : false, default : Date.now},
	name : {type : String, required : true, unique : true}
});


module.exports = mongoose.model('Category', CategorySchema);