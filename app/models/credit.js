var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var CreditSchema = new Schema({
	owner : {type : Schema.Types.ObjectId, required : true, ref : 'User'},
	type : {type : Schema.Types.ObjectId, required : true, ref : 'PaymentMode'},
	value : {type : Number, required : true, default : 0},
	available_value : {type : Number, required : true, default : 0},
	created_at : {type : Date, required : false, default : Date.now},
	date : {type : Date, required : false, default : Date.now},
	expiration_date : {type : Date, required : false, default : null}
});


module.exports = mongoose.model('Credit', CreditSchema);