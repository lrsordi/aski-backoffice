var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var TimelineItemSchema = new Schema({
	owner : {type : Schema.Types.ObjectId, required : true, ref : 'User'},
	timeline_category : {type : Schema.Types.ObjectId, required : true, ref : 'TimelineItemCategory'},
	category : {type : Schema.Types.ObjectId, required : true, ref : 'Category'},
	title : {type : String, required : true},
	description : {type : String, required : false},
	action : {type : String, required : true},
	created_at : {type : Date, required : false, default : Date.now}
});


module.exports = mongoose.model('TimelineItem', TimelineItemSchema);