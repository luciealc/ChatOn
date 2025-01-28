// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Channel = require('./models/Channel');
const User = require('./models/User');
// const routes = require('./routes'); // si tu veux brancher l'API REST

const app = express();
const server = http.createServer(app);

// Configuration Socket.IO
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(express.json());
// app.use('/api', routes);

// Connexion MongoDB
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// Dictionnaire : socket.id -> user
const activeUsers = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // /nick
  socket.on('setNickname', async (nickname) => {
    try {
      let user = await User.findOne({ nickname });
      if (!user) {
        user = new User({ nickname });
        await user.save();
      }
      activeUsers[socket.id] = user;
      socket.emit('nicknameSet', user.nickname);
      console.log(`[${socket.id}] => Nickname: ${user.nickname}`);
    } catch (error) {
      socket.emit('error', 'Could not set nickname');
    }
  });

  // /list
  socket.on('listChannels', async () => {
    try {
      const channels = await Channel.find({}, 'name');
      socket.emit('channelList', channels.map(ch => ch.name));
    } catch (error) {
      socket.emit('error', 'Could not list channels');
    }
  });

  // /create
  socket.on('createChannel', async (channelName) => {
    try {
      const existing = await Channel.findOne({ name: channelName });
      if (existing) {
        socket.emit('error', `Channel "${channelName}" already exists`);
        return;
      }
      const channel = new Channel({ name: channelName });
      await channel.save();
      io.emit('channelCreated', channelName);
      console.log(`Channel created: ${channelName}`);
    } catch (error) {
      socket.emit('error', 'Could not create channel');
    }
  });

  // /delete
  socket.on('deleteChannel', async (channelName) => {
    try {
      const deleted = await Channel.findOneAndDelete({ name: channelName });
      if (deleted) {
        io.emit('channelDeleted', channelName);
        console.log(`Channel deleted: ${channelName}`);
      } else {
        socket.emit('error', `Channel "${channelName}" not found`);
      }
    } catch (error) {
      socket.emit('error', 'Could not delete channel');
    }
  });
  // /join
  socket.on('joinChannel', async (channelName) => {
    try {
      const channel = await Channel.findOne({ name: channelName }).populate('messages.user', 'nickname');
      if (!channel) {
        socket.emit('error', `Channel "${channelName}" not found`);
        return;
      }
      const user = activeUsers[socket.id];
      if (!user) {
        socket.emit('error', 'You must set a nickname first');
        return;
      }
      if (!channel.users.includes(user._id)) {
        channel.users.push(user._id);
        await channel.save();
      }
      socket.join(channelName);
      io.to(channelName).emit('userJoined', user.nickname);
      // Envoyer les messages existants au client
      socket.emit('loadMessages', channel.messages.map(msg => ({
        user: msg.user.nickname,
        message: msg.content,
        timestamp: msg.timestamp
      })));
      console.log(`${user.nickname} joined [${channelName}]`);
    } catch (error) {
      socket.emit('error', 'Could not join channel');
    }
  });
  
  // /quit
  socket.on('quitChannel', async (channelName) => {
    try {
      const channel = await Channel.findOne({ name: channelName });
      if (!channel) {
        socket.emit('error', `Channel "${channelName}" not found`);
        return;
      }
      const user = activeUsers[socket.id];
      if (!user) return;

      channel.users = channel.users.filter(u => u.toString() !== user._id.toString());
      await channel.save();

      socket.leave(channelName);
      io.to(channelName).emit('userLeft', user.nickname);
      console.log(`${user.nickname} left [${channelName}]`);
    } catch (error) {
      socket.emit('error', 'Could not quit channel');
    }
  });

  // sendMessage (public)
  socket.on('sendMessage', async ({ channelName, message }) => {
    try {
      const channel = await Channel.findOne({ name: channelName });
      if (!channel) {
        socket.emit('error', `Channel "${channelName}" not found`);
        return;
      }
      const user = activeUsers[socket.id];
      if (!user) return;

      channel.messages.push({
        user: user._id,
        content: message,
        timestamp: new Date()
      });
      await channel.save();

      io.to(channelName).emit('message', { user: user.nickname, message });
    } catch (error) {
      socket.emit('error', 'Could not send message');
    }
  });

  // privateMessage
  socket.on('privateMessage', async ({ toNickname, message }) => {
    try {
      const fromUser = activeUsers[socket.id];
      if (!fromUser) return;

      const toUser = await User.findOne({ nickname: toNickname });
      if (!toUser) {
        socket.emit('error', `User "${toNickname}" not found`);
        return;
      }
      const recipientSocketId = Object.keys(activeUsers).find(
        sid => activeUsers[sid]._id.toString() === toUser._id.toString()
      );
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('privateMessage', {
          from: fromUser.nickname,
          message
        });
      } else {
        socket.emit('error', `User "${toNickname}" is not online`);
      }
    } catch (error) {
      socket.emit('error', 'Could not send private message');
    }
  });

  // /users
  socket.on('listUsers', async (channelName) => {
    try {
      const channel = await Channel.findOne({ name: channelName }).populate('users');
      if (!channel) {
        socket.emit('error', `Channel "${channelName}" not found`);
        return;
      }
      const nicknames = channel.users.map(u => u.nickname);
      socket.emit('userList', { channel: channelName, users: nicknames });
    } catch (error) {
      socket.emit('error', 'Could not list users');
    }
  });

  // uploadFile (optionnel)
  socket.on('uploadFile', async ({ channelName, fileName, fileData }) => {
    try {
      const channel = await Channel.findOne({ name: channelName });
      if (!channel) {
        socket.emit('error', `Channel "${channelName}" not found`);
        return;
      }
      const user = activeUsers[socket.id];
      if (!user) {
        socket.emit('error', 'You must set a nickname first');
        return;
      }
      // On relaye le fichier en base64 (ou on le stocke si on veut)
      io.to(channelName).emit('fileReceived', {
        from: user.nickname,
        fileName,
        fileData
      });
      console.log(`${user.nickname} uploaded file "${fileName}" to channel [${channelName}]`);
    } catch (error) {
      console.error('Error in uploadFile:', error);
      socket.emit('error', 'Could not upload file');
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const user = activeUsers[socket.id];
    if (user) {
      delete activeUsers[socket.id];
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Lancement du serveur
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
