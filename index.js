const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Basic bot config, modify as needed
const bot = {
  name: 'SHUBHAM MD',
  displayName: 'MR SHUBHAM',
  prefix: '.',
  owner: {
    number: '916260273863',
    sudo: ['916260273863', '916262815528'],
  },
  plugins: new Map(),
  featureSettings: {}, // For plugin on/off or feature flags
};

// Load plugins from /plugins folder
function loadPlugins() {
  const pluginFolder = path.join(__dirname, 'plugins');
  if (!fs.existsSync(pluginFolder)) fs.mkdirSync(pluginFolder);

  const files = fs.readdirSync(pluginFolder).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      const plugin = require(path.join(pluginFolder, file));
      if (plugin && plugin.name) {
        bot.plugins.set(plugin.name, plugin);
        console.log(`🧩 Loaded plugin: ${plugin.name}`);
      }
    } catch (err) {
      console.log(`❌ Error loading plugin ${file}:`, err);
    }
  }
}

async function startBot() {
  // Session ID from config.env
  const sessionId = process.env.SESSION_ID;
  if (!sessionId) {
    console.log('❗ SESSION_ID missing in config.env. Pair first.');
    return;
  }

  const sessionFolder = path.join(__dirname, 'sessions', sessionId);
  if (!fs.existsSync(sessionFolder)) {
    console.log('❗ Session folder missing. Pair again.');
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'info' }),
    printQRInTerminal: false,
    browser: ['Bot', 'Chrome', '1.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log(`✅ ${bot.name} connected to WhatsApp!`);
      sendStartupInfo(sock);
    } else if (connection === 'close') {
      console.log('❌ Disconnected.');
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log('⚠️ Session expired. Please re-pair.');
      }
    }
  });

  // Handle messages and commands
  sock.ev.on('messages.upsert', async (m) => {
    if (!m.messages) return;
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;

    if (!text.startsWith(bot.prefix)) return;

    const commandBody = text.slice(bot.prefix.length).trim();
    const commandName = commandBody.split(' ')[0].toLowerCase();
    const args = commandBody.split(' ').slice(1);

    // Find and execute command in plugins
    for (const plugin of bot.plugins.values()) {
      if (!plugin.enabled) continue;

      const cmd = plugin.commands?.find(c => c.name === commandName);
      if (cmd) {
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNum = sender.split('@')[0];

        if (cmd.ownerOnly && !bot.owner.sudo.includes(senderNum)) {
          await sock.sendMessage(msg.key.remoteJid, { text: '❌ You are not authorized to use this command.' });
          return;
        }

        try {
          await cmd.execute({ sock, msg, args, bot });
        } catch (e) {
          console.error('❌ Command error:', e);
          for (const sudoNum of bot.owner.sudo) {
            const jid = `${sudoNum}@s.whatsapp.net`;
            await sock.sendMessage(jid, { text: `⚠️ Error in command *${commandName}*:\n${e.message}` });
          }
        }
        break;
      }
    }
  });
}

// Send startup info to owner on connect
async function sendStartupInfo(sock) {
  const runtime = (process.uptime() / 60).toFixed(2);
  const infoMsg = `🤖 *${bot.name}* connected!
Prefix: ${bot.prefix}
Owner: ${bot.displayName}
Owner Number: +${bot.owner.number}
Uptime: ${runtime} minutes
Send ${bot.prefix}menu to see all commands.`;
  
  await sock.sendMessage(`${bot.owner.number}@s.whatsapp.net`, { text: infoMsg });
}

// Load plugins & start bot
loadPlugins();
startBot();