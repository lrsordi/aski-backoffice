var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var QuestionInteractionSchema = new Schema({
	from : {type : Schema.Types.ObjectId, required : true, ref : "User"},
	to : {type : Schema.Types.ObjectId, required : true, ref : "User"},
	content : {type : String, required : true},
	media : [{type : Schema.Types.ObjectId, ref : 'Media'}]
});


module.exports = mongoose.model('QuestionInteraction', QuestionInteractionSchema);