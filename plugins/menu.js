const { bot, getBuffer, jidToNum, genThumbnail } = require('../lib/'); const { VERSION } = require('../config'); const { textToStylist, getUptime } = require('../lib/'); const os = require('os');

const url = 'https://files.catbox.moe/3ee7zo.jpeg';

bot( { pattern: 'menu ?(.*)', desc: 'Advanced Custom Menu', type: 'misc', }, async (message, match, ctx) => { const jid = message.jid; const number = message.client.user.jid; const pushName = message.pushName || jidToNum(jid);

const [thumb, thumbnail] = await Promise.all([
  getBuffer(url),
  getBuffer(url),
]);

const uptime = getUptime();

const sorted = ctx.commands.sort((a, b) =>
  a.name && b.name ? a.name.localeCompare(b.name) : 0
);

const commands = {};
let totalCmds = 0;

ctx.commands.forEach((command) => {
  if (!command.dontAddCommandList && command.pattern) {
    let cmdType = command.type ? command.type.toLowerCase() : 'misc';
    if (!commands[cmdType]) commands[cmdType] = [];
    let isDisabled = command.active === false;
    let cmd = command.name.trim();
    let formattedCmd = '.' + cmd.charAt(0).toUpperCase() + cmd.slice(1);
    formattedCmd = textToStylist(formattedCmd, 'bold');
    commands[cmdType].push(isDisabled ? `${formattedCmd} [disabled]` : formattedCmd);
    totalCmds++;
  }
});

const categoryIcons = {
  owner: '👑', bot: '🤖', audio: '🎵', sticker: '🖼️', search: '🔍', downloader: '⬇️',
  group: '👥', game: '🎮', fun: '😂', tools: '🛠️', user: '🙋‍♂️', misc: '🧩', photo: '📸',
  text: '📝', anime: '🎌', ai: '🧠', textmaker: '✍️', vars: '📊', plugin: '🔌',
  document: '📃', logia: '🧠', autoreply: '🤖', schedule: '📅', personal: '🧍‍♂️',
  budget: '💰', video: '🎬', whatsapp: '📱'
};

let CMD_HELP = `*╭━━❍〘 🅢︎🅗︎🅤︎🅑︎🅗︎🅐︎🅜︎-Ⓜ︎Ⓓ︎ 〙❍━━╮*\n`;
CMD_HELP += `*┃👑 Owner:* ✪SHUBHAM🌻SIR\n*┃🙋 User:* ${pushName}\n*┃📦 Version:* ${VERSION}\n*┃📊 Total Cmds:* ${totalCmds}\n*┃⏱️ Uptime:* ${uptime}\n*╰━━━━━━━━━━━━━━━━━━━━╯*\n`;

for (let cmdType in commands) {
  const icon = categoryIcons[cmdType] || '📁';
  CMD_HELP += `\n*╭──❍ ${icon} ${cmdType.toUpperCase()} ❍*\n`;
  commands[cmdType].forEach((cmd) => {
    CMD_HELP += `*├⬡ ${cmd}*\n`;
  });
  CMD_HELP += '*┕──────────────────❍*\n';
}

CMD_HELP += `\n*╭━━━[ 𝙊𝙒𝙉𝙀𝙍 𝙄𝙉𝙁𝙊 ]━━━╮*\n*┃ 𝙉𝙖𝙢𝙚:* Sʜᴜʙʜᴀᴍ ᴋᴜᴍᴀʀ\n*┃ 𝙉𝙪𝙢𝙗𝙚𝙧:* +916260273863\n*┃ 𝙄𝙉𝙎𝙏𝘼:* @𝘔𝘴𝘳_𝘴𝘩𝘶𝘣𝘩𝘢𝘮_𝘬\n*┃ 𝙔𝙏:* yt/shubham777k\n*┃ 𝙀𝙢𝙪𝙞𝙡:* kumaruikeshubham@gmail.com\n*╰━━━━━━━━━━━━━━━━━━━━━╯*`;

const Data = {
  linkPreview: {
    renderLargerThumbnail: true,
    showAdAttribution: true,
    head: 'ʕっ•ᴥ•ʔっ',
    body: '🇮🇳SHUBHAM.K',
    mediaType: 1,
    thumbnail: thumb.buffer,
    sourceUrl: 'https://wa.me/916260273863?text=HELLO+SHUBHAM+SIR🌻',
  },
};

return await message.send(CMD_HELP, Data);

} );
