const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Array to store active sessions
let sessions = [];

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('Scan this QR code to link your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready!');
    // Generate a session ID after successful connection
    let sessionId = Date.now();
    sessions.push(sessionId);
    client.sendMessage(client.info.wid._serialized, `Your bot is successfully connected! Session ID: ${sessionId}`);
});

client.on('message', async (message) => {
    if (message.body === '.menu') {
        message.reply('Here are the available commands:\n.menu - List all commands\n.install <Git URL> - Add a feature\n.remove <Git URL> - Remove a feature\n.owner - Show owner details');
    } else if (message.body.startsWith('.install')) {
        let gitUrl = message.body.split(' ')[1];
        message.reply(`Installing feature from ${gitUrl}`);
    } else if (message.body.startsWith('.remove')) {
        let gitUrl = message.body.split(' ')[1];
        message.reply(`Removing feature from ${gitUrl}`);
    } else if (message.body === '.owner') {
        message.reply('Owner: John Doe\nNumber: +1234567890\n[Profile Picture URL]');
    }
});

client.initialize();
