import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );


  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }


  try {

    const url = `https://nyaa.si/?f=0&c=1_2&q=${encodeURIComponent(q)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error('Nyaa site is unreachable');
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];


    $('tbody tr').each((i, element) => {
      const tds = $(element).find('td');
      if (tds.length < 6) return;

      const titleLink = $(tds[1]).find('a:not(.comments)');
      const magnetLink = $(tds[2]).find('a[href^="magnet:"]');
      
      if (!titleLink.length || !magnetLink.length) return;

      results.push({
        Name: titleLink.text().trim(),
        Magnet: magnetLink.attr('href'),
        Size: $(tds[3]).text().trim(),
        DateUploaded: $(tds[4]).text().trim(),
        Seeders: $(tds[5]).text().trim(),
        Leechers: $(tds[6]).text().trim(),
        Downloads: $(tds[7]).text().trim()
      });
    });

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
