// Adapted for Leventer bot style

const axios = require('axios');
const cheerio = require('cheerio');
const { bot } = require('../lib');

class SFMHandler {
  constructor() {
    this.baseUrl = 'https://sfmcompile.club';
  }

  async getRandomVideos() {
    try {
      const page = Math.floor(Math.random() * 1153);
      const url = `${this.baseUrl}/page/${page}`;
      const response = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(response.data);
      const results = [];

      $('#primary > div > div > ul > li > article').each((_, el) => {
        const $el = $(el);
        const title = $el.find('header > h2').text().trim();
        const link = $el.find('header > h2 > a').attr('href');
        const category = $el.find('header > div.entry-before-title > span > span').text().replace('in ', '').trim();
        const shareCount = parseInt($el.find('span.entry-shares').text().replace(/\D/g, '') || '0');
        const viewsCount = parseInt($el.find('span.entry-views').text().replace(/\D/g, '') || '0');
        const videoUrl = $el.find('source').attr('src') || $el.find('img').attr('data-src');
        const fileType = $el.find('source').attr('type') || 'image/jpeg';

        if (videoUrl) {
          results.push({
            title,
            link,
            category,
            shares: shareCount,
            views: viewsCount,
            media: {
              url: videoUrl,
              type: fileType
            }
          });
        }
      });

      if (!results.length) throw new Error('No videos found');

      return {
        code: 200,
        status: true,
        result: results
      };

    } catch (err) {
      console.error('SFM error:', err.message);
      throw new Error(`Fetch failed: ${err.message}`);
    }
  }
}

// Bot command
bot(
  {
    pattern: 'sfm ?(.*)',
    fromMe: true,
    desc: 'Get random SFM Hentai videos',
    type: 'anime',
  },
  async (message, match) => {
    try {
      const response = await sfmHandler.getRandomVideos();
      const results = response.result.slice(0, 3); // Show top 3 results

      for (const video of results) {
        try {
          const fileRes = await axios.get(video.media.url, {
            responseType: 'arraybuffer',
            timeout: 30000
          });

          const buffer = Buffer.from(fileRes.data);
          const caption = `*🎬 Title:* ${video.title}\n*📂 Category:* ${video.category}\n*👀 Views:* ${video.views}\n*🔁 Shares:* ${video.shares}\n*🔗 Link:* ${video.link}`;

          await message.send(buffer, {
            caption,
            mimetype: video.media.type,
            fileName: `${video.title}.mp4`
          }, 'video');

        } catch (err) {
          console.error('Video buffer error:', err.message);
          await message.send(`❌ Failed to load: ${video.title}`);
        }
      }
    } catch (err) {
      console.error('Command error:', err.message);
      await message.send(`❌ Error: ${err.message}`);
    }
  }
);

const sfmHandler = new SFMHandler();
module.exports = { sfmHandler };