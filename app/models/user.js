var mongoose = require('mongoose');
var passport = require('passport');
var bcrypt = require('bcrypt');

var Schema = mongoose.Schema;


var UserSchema = new Schema({
	full_name : {type : String, required : true},
	password : {type : String, required : true},
	username : {type : String, required : true},
	email : {type : String, required : true},
	picture_id : {type : ObjectId, ref : "MediaSchema", required : false},
	facebook_id : {type : Number, required : false},
	cpf : {type : Number, required : false},
	cnpj : {type : Number, required : false},
	is_documents_validated : {type : Boolean, default : false},
	is_consultant : {type : Boolean, default : false},
	category_id : {type : ObjectId, ref : "CategorySchema", required : false},
	level : {type : ObjectId, ref : "LevelSchema", required : false}
});



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


module.exports = mongoose.Model('User', UserSchema);