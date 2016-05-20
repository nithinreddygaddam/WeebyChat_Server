/**
 * Created by Nithin on 5/16/16.
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

//mongo DB connection
mongoose.connect("mongodb://127.0.0.1:27017/weebyChat");

require('./models/ChatMessages');
require('./models/ChatRooms');
require('./models/Users');

//models
var User = mongoose.model('User');
var ChatRoom = mongoose.model('ChatRoom');
var ChatMessage = mongoose.model('ChatMessage');

//testing a REST call
app.get('/', function(req, res){
  res.send('<h1>Weeby Chat Server</h1>');
});

//Socket io is at this port
http.listen(7007, function(){
  console.log('Listening on *:7007');
});

//Socket connection initiation Singleton
io.on('connection', function(clientSocket){
  console.log('a user connected');

  
  //disconnecting user from a group
  clientSocket.on('disconnect', function(user, room){
    console.log('user disconnected');

    if (room != null && user != null){

      ChatRoom.findOne({_id: room},function(err, currentRoom) {
        if (err) {
          return next(err);
        }

        currentRoom.users.pull(user.username);
        console.log(currentRoom);
        currentRoom.save(function (err, presentRoom) {
          if (err) {
            return next(err);
          }
          console.log('User was removed from chat room')
          clientSocket.leave(presentRoom.roomName);
          io.in(presentRoom.roomName).emit('userExitUpdate', user);
        });

      });

    }

  });

  //registering User
  clientSocket.on('registerUser', function(username){
    
    console.log("Registering User");
    var user = new User();
    user.username = username;
    User.findOne({username: username}, function (err, existingUser) {
      if (err) {
        return next(err);
      }
      if (!existingUser) {
        user.save(function (err, user) {
          if (err) {
            return next(err);
          }
          console.log(user);
          clientSocket.emit("successRegistering", user);
        });
      }
      else{
        clientSocket.emit("userExists", {"_id" : "error"});
      }
    });


  });

  //Adding a char room
  clientSocket.on('addChatRoom', function(user, roomName){
    
    console.log("Adding Room");
    var chatRoom = new ChatRoom();
    chatRoom.roomName = roomName;
    chatRoom.createdBy = user;
    console.log(roomName);
    console.log(user);

    chatRoom.save(function (err, room) {
      if (err) {
        return next(err);
      }
      console.log(room);
      clientSocket.emit("successAddingRoom", room);
    });
  });

  //Get list of chatRooms
  clientSocket.on('getChatRooms', function(){

    console.log("getting rooms")
    ChatRoom.find(function(err, chatRooms) {
      if (err) {
        return next(err);
      }
      console.log(chatRooms)
      clientSocket.emit("chatRooms", chatRooms);
    });
  });

  //Connect User to the chat room
  clientSocket.on("connectUser", function(user, room) {
    var message = "User " + user.username + " was connected.";
    console.log(message);
    console.log(room);

    ChatRoom.findOne({_id: room},function(err, currentRoom) {
      if (err) {
        return next(err);
      }

      currentRoom.users.push(user.username);
      console.log(currentRoom);
      currentRoom.save(function (err, presentRoom) {
        if (err) {
          return next(err);
        }
        console.log('User added to chat room')

        //New user joins the room
        clientSocket.join(presentRoom.roomName);


        //Tell all those in the room that a new user joined
        io.in(presentRoom.roomName).emit("userConnectUpdate", user)
        console.log('emit done')
      });

    });
  });


  //Exit user from chat room
  clientSocket.on("exitUser", function(user, room){

    ChatRoom.findOne({_id: room},function(err, currentRoom) {
      if (err) {
        return next(err);
      }

      currentRoom.users.pull(user.username);
      console.log(currentRoom);

        currentRoom.save(function (err, presentRoom) {
          if (err) {
            return next(err);
          }
          console.log('User was removed from chat room')
          clientSocket.leave(presentRoom.roomName);
          io.in(presentRoom.roomName).emit('userExitUpdate', user);
        });

      });
  });


  //Messages generated from chat broadcast to their respective rooms
  clientSocket.on('chatMessage', function(user, room, message){
    var currentDateTime = new Date().toLocaleString();

    var chatMessage = new ChatMessage();
    chatMessage.created = currentDateTime;
    chatMessage.content = message;
    chatMessage.user = user;
    chatMessage.room = room;

    chatMessage.save(function (err) {
      if(err){ return next(err); }
      console.log('Message saved')
      io.in(room.roomName).emit('newChatMessage', user, message, currentDateTime);
    });

  });


});
