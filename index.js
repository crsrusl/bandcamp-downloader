const _ = require('lodash')
const request = require('request')
const fs = require('fs');
const axios = require('axios')
const artistPage = process.argv[2]

if (!_.startsWith(artistPage, 'http')) {
  console.log('bad url');
  process.exit(1);
}

request(artistPage, function (err, response, body) {
  if (!err && response.statusCode == 200) {
    const data = body.split('trackinfo: ')[1].split('}],')[0] + '}]';
    const parsed = JSON.parse(data);
    const albumTitle = body.split('album_title: ')[1].split(',')[0].split('"')[1]
    const artist = body.split('artist: ')[1].split(',')[0].split('"')[1];
    const albumName = `./downloads/${artist.replace(/\//g, '-')} - ${albumTitle.replace(/\//g, '-')}`;

    const format = _.map(parsed, function (item) {
      if (item && item.file && item.file["mp3-128"])
        return {
          title: item.title,
          url: item.file["mp3-128"],
          album: albumTitle,
          artist: artist
        }
    });

    if (!fs.existsSync(albumName)){
      fs.mkdirSync(albumName);
    }

    _.each(format, function (item) {
      if (item)
        axios({
          method: 'get',
          url: item.url,
          responseType: 'stream'
        })
        .then(function (response) {
          response.data.pipe(fs.createWriteStream(`./${albumName}/${item.title}.mp3`));
        })
        .catch(err => console.log(err));
    });
  }
})
