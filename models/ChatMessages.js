/**
 * Created by Nithin on 5/16/16.
 */

var mongoose = require('mongoose');

var ChatMessagesSchema = mongoose.Schema({
  created: Date,
  content: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }
});

mongoose.model('ChatMessage', ChatMessagesSchema);
