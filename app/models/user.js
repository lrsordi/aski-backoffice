var mongoose = require('mongoose');
var passport = require('passport');
var bcrypt = require('bcrypt');
var uniqueValidator = require('mongoose-unique-validator');
var unirest = require("unirest");
var autopopulate = require('mongoose-autopopulate');
var Schema = mongoose.Schema;


var UserSchema = new Schema({
	full_name : {type : String, required : true},
	password : {type : String, required : true},
	username : {type : String, required : true, unique : true},
	email : {type : String, required : true, unique : true},
	picture_id : {type : Schema.Types.ObjectId, ref : "Media"},
	facebook_id : {type : Number, required : false},
	cpf : {type : String, required : false},
	cnpj : {type : String, required : false},
	is_documents_validated : {type : Boolean, default : false},
	is_picture_validated : {type : Boolean, default : false},
	is_consultant : {type : Boolean, default : false},
	category_id : {type : Schema.Types.ObjectId, ref : "Category", required : false},
	document_image_id : {type : Schema.Types.ObjectId, ref : "Media"},
	level : {type : Schema.Types.ObjectId, ref : "Level", required : false},
	created_at : {type : Date, default : Date.now},
	updated_at : {type : Date},
    consulting_price : {type : Number, required : false},
    consulting_days : {type : Number, required : false}
});

UserSchema.plugin(uniqueValidator);
UserSchema.plugin(autopopulate);



UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});
 
UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};


module.exports = mongoose.model('User', UserSchema);