require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3000;
const PREFIX = process.env.PREFIX || '.';

// Load feature settings from JSON
function loadFeatureSettings() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', 'featureSettings.json'), 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.log("⚠️ Feature settings load nahi ho payi:", e);
    return {};
  }
}

// Global bot object to share features & plugins
const bot = {
  featureSettings: loadFeatureSettings(),
  plugins: new Map(),
  prefix: PREFIX,
  owner: {
    name: process.env.OWNER_NAME || 'Owner',
    number: process.env.OWNER_NUMBER || '',
    sudo: (process.env.SUDO_NUMBERS || '').split(',').map(s => s.trim()),
  },
  socket: null, // WhatsApp socket instance
};

// --- Express setup for serving panel and API ---

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// TODO: Add API routes for session handling, QR, etc. later

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});

// --- WhatsApp connection logic ---

async function startBot(sessionId) {
  if (!sessionId) {
    console.log('❗ SESSION_ID missing in .env');
    return;
  }

  const sessionFolder = path.join(__dirname, 'sessions', sessionId);

  if (!fs.existsSync(sessionFolder)) {
    console.log('❗ Session folder not found. Please pair your WhatsApp first.');
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'info' }),
    browser: ['Bot', 'Chrome', '1.0'],
  });

  bot.socket = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📲 Scan this QR to connect WhatsApp:\n', qr);
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp bot connected!');
      sendStartupInfo();
    }

    if (connection === 'close') {
      console.log('❌ Disconnected from WhatsApp');
      const reason = lastDisconnect?.error?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut) {
        console.log('⚠️ Session expired, please re-pair!');
      }
    }
  });

  // Listen to messages
  sock.ev.on('messages.upsert', async (m) => {
    if (!m.messages) return;
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // Example: Simple prefix command handler
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;

    if (text.startsWith(bot.prefix)) {
      const commandBody = text.slice(bot.prefix.length).trim();
      const commandName = commandBody.split(' ')[0].toLowerCase();
      const args = commandBody.split(' ').slice(1);

      // TODO: plugin commands lookup & execute (later)

      if (commandName === 'ping') {
        await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' });
      }

      if (commandName === 'alive') {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Bot is online!\nOwner: ${bot.owner.name}\nPrefix: ${bot.prefix}`
        });
      }

      // ... add more commands here later
    }
  });
}

// Function to send startup info to owner
async function sendStartupInfo() {
  const sock = bot.socket;
  if (!sock) return;

  const ownerJid = `${bot.owner.number}@s.whatsapp.net`;
  const aliveMsg = `🤖 Bot Connected\nName: LevanterBot\nOwner: ${bot.owner.name}\nNumber: ${bot.owner.number}\nPrefix: ${bot.prefix}\n\nSend ${bot.prefix}menu to see commands`;

  await sock.sendMessage(ownerJid, { text: aliveMsg });
}

// Start bot with SESSION_ID from .env
startBot(process.env.SESSION_ID);