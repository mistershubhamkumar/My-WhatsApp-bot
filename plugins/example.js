module.exports = {
  name: 'example',
  description: 'Sample greet plugin',
  enabled: true, // Enable/disable plugin globally

  commands: [
    {
      name: 'greet',
      description: 'Set greet message for unknown users',
      usage: '.greet <message>',
      ownerOnly: false,
      async execute({ sock, msg, args, bot }) {
        if (!args.length) {
          await sock.sendMessage(msg.key.remoteJid, { text: 'Usage: .greet Hello there!' });
          return;
        }
        const greetMsg = args.join(' ');
        bot.featureSettings.greetMessage = greetMsg;
        await sock.sendMessage(msg.key.remoteJid, { text: `Greet message set to:\n${greetMsg}` });
      }
    },
    {
      name: 'greetdel',
      description: 'Delete greet message',
      usage: '.greetdel',
      ownerOnly: true,
      async execute({ sock, msg, bot }) {
        delete bot.featureSettings.greetMessage;
        await sock.sendMessage(msg.key.remoteJid, { text: 'Greet message deleted.' });
      }
    }
  ]
};