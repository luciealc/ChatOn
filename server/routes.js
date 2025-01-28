// routes.js
const express = require('express');
const router = express.Router();
const Channel = require('./models/Channel');
const User = require('./models/User');

// Liste tous les canaux
router.get('/channels', async (req, res) => {
  try {
    const channels = await Channel.find();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crée un canal
router.post('/channels', async (req, res) => {
  try {
    const channel = new Channel(req.body);
    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprime un canal
router.delete('/channels/:id', async (req, res) => {
  try {
    const deleted = await Channel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Liste les utilisateurs dans un canal
router.get('/channels/:id/users', async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('users');
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(channel.users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change le nickname d'un user
router.patch('/users/:id/nickname', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.nickname = req.body.nickname;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
