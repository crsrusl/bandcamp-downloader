const fs = require('fs');
const axios = require('axios')
const NodeID3 = require('node-id3')
const artistPage = process.argv[2]

if (!artistPage) {
  console.log('Need URL');
  process.exit(1);
}

axios.get(artistPage, {responseType: 'text'}).then(function (response) {
    const body = response.data;
    const data = body.split('trackinfo: ')[1].split('}],')[0] + '}]';
    const parsed = JSON.parse(data);
    const albumTitle = body.split('album_title: ')[1].split(',')[0].split('"')[1];
    const artist = body.split('artist: ')[1].split(',')[0].split('"')[1];
    const albumName = `./downloads/${artist.replace(/\//g, '-')} - ${albumTitle.replace(/\//g, '-')}`;

    const format = parsed.map(function (item) {
      if (item && item.file && item.file["mp3-128"])
        return {
          title: item.title,
          url: item.file["mp3-128"],
          album: albumTitle,
          artist: artist,
          trackNumber: item.track_num
        }
    });

    if (!fs.existsSync(albumName)){
      fs.mkdirSync(`./downloads/${artist.replace(/\//g, '-')} - ${albumTitle.replace(/\//g, '-')}`);
    }

    format.forEach(function (item) {
      if (item)
        axios({method: 'get', url: item.url, responseType: 'stream'})
        .then(function (response) {
          let write = fs.createWriteStream(`./${albumName}/${item.title}.mp3`);

          response.data.pipe(write);

          write.on('finish', () => {
            let file = `./${albumName}/${item.title}.mp3`;
            let tags = {
              title: item.title,
              artist: item.artist,
              album: item.album,
              trackNumber: item.trackNumber,
              comment: {
                text: artistPage
              }
            }
            let success = NodeID3.write(tags, file);

            if (success===true) {
              console.log('saved: ', tags)
            }
            else {
              console.log('error: error saving ID3 tag for ', tags)
            }
          });
        })
        .catch(err => console.log(err));
    });
}).catch(err => console.log(err))
