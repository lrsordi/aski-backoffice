var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var PaymentModeSchema = new Schema({
	created_at : {type : Date, required : false, default : Date.now},
	name : {type : String, required : true}
});


module.exports = mongoose.model('PaymentMode', PaymentModeSchema);