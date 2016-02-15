var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var QuestionSchema = new Schema({
	created_at : {type : Date, required : false, default : Date.now},
	title : {type : String, required : true},
	question_owner : {type : Schema.Types.ObjectId, ref : 'User', required : true},
	answerer : {type : Schema.Types.ObjectId, required : false, ref : 'User'},
	expiration_date : {type : Date},
	interactions : [{type : Schema.Types.ObjectId, ref : 'QuestionInteraction', required:true}],
	question_type : {type : Schema.Types.ObjectId, ref : 'QuestionType', required:true}
});


module.exports = mongoose.model('Question', QuestionSchema);