/**
 * Created by Nithin on 5/16/16.
 */

var mongoose = require('mongoose');

var UsersSchema = mongoose.Schema({
    username: String
});

mongoose.model('User', UsersSchema);