var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var TimelineItemCategorySchema = new Schema({
	name: {type : String, required : true},
	description : {type : String, required : true},
	icon_id : {type : String, required : true},
	created_at : {type : Date, required : false, default : Date.now}
});


module.exports = mongoose.model('TimelineItemCategory', TimelineItemCategorySchema);