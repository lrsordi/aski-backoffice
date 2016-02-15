var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var LevelSchema = new Schema({
	created_at : {type : Date, required : false, default : Date.now},
	name : {type : String, required : true}
});


module.exports = mongoose.model('Level', LevelSchema);