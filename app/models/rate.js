var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var RateSchema = new Schema({
	created_at : {type : Date, required : false, default : Date.now},
	question_id : {type : Schema.Types.ObjectId, required : true, ref : 'Question'},
	user_appraiser : {type : Schema.Types.ObjectId, required : true, ref : 'User'},
	user_appraised : {type : Schema.Types.ObjectId, required : true, ref : 'User'},
	rate : {type : Number, required : true, default : 5}
});


module.exports = mongoose.model('Rate', RateSchema);