var mongoose = require('mongoose');
var passport = require('passport');
var bcrypt = require('bcrypt');
var uniqueValidator = require('mongoose-unique-validator');
var unirest = require("unirest");

var Schema = mongoose.Schema;


var UserSchema = new Schema({
	full_name : {type : String, required : true},
	password : {type : String, required : true},
	username : {type : String, required : true, unique : true},
	email : {type : String, required : true, unique : true},
	picture_id : {type : Schema.Types.ObjectId, ref : "MediaSchema"},
	facebook_id : {type : Number, required : false},
	cpf : {type : String, required : false},
	cnpj : {type : String, required : false},
	is_documents_validated : {type : Boolean, default : false},
	is_consultant : {type : Boolean, default : false},
	category_id : {type : Schema.Types.ObjectId, ref : "CategorySchema", required : false},
	document_image_id : {type : Schema.Types.ObjectId, ref : "MediaSchema"},
	level : {type : Schema.Types.ObjectId, ref : "LevelSchema", required : false},
	created_at : {type : Date, default : Date.now},
	updated_at : {type : Date}
});

UserSchema.plugin(uniqueValidator);



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