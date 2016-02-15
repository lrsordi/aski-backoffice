var mongoose  = require('mongoose');
var Schema = mongoose.Schema;
var autopopulate = require('mongoose-autopopulate');

var QuestionInteractionSchema = new Schema({
	from : {type : Schema.Types.ObjectId, required : true, ref : "User"},
	to : {type : Schema.Types.ObjectId, required : true, ref : "User"},
	content : {type : String, required : true},
	media : [{type : Schema.Types.ObjectId, ref : 'Media'}]
});

QuestionInteractionSchema.plugin(autopopulate);

module.exports = mongoose.model('QuestionInteraction', QuestionInteractionSchema);