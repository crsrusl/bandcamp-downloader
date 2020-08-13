const fs = require('fs');
const axios = require('axios');
const NodeID3 = require('node-id3');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const artistPage = process.argv[2]
const batchPath = './batch.txt'
let urls;

if (artistPage) {
  get(artistPage);
}
else if(fs.existsSync(batchPath)) {
  fs.readFile(batchPath, 'utf8', (err, data) => {
    if (err) throw err;
    urls = data.split('\n');

    console.log(urls);

    get(urls[urls.length-1], urls.length);
  });}
else {
  console.log('No URL or batch.txt');
  process.exit(1);
}


function get(artistPage, i) {
  if (i < 0) {
    console.log('Finished');
  }
  else {

  axios.get(artistPage, {responseType: 'text'}).then(function (response) {
    const body = response.data;
    const data = body.split('trackinfo: ')[1].split('}],')[0] + '}]';
    const parsed = JSON.parse(data);
    const albumTitle = body.split('album_title: ')[1].split(',')[0].split('"')[1];
    const artID = 'a' + body.split('art_id: ')[1].split(',')[0] + '_16';
    const artworkURL =  'https://f4.bcbits.com/img/' + artID;
    const artist = body.split('artist: ')[1].split(',')[0].split('"')[1];
    const albumName = `./downloads/${artist.replace(/\//g, '-')} - ${albumTitle.replace(/\//g, '-')}`;
    let genre;

    if (body.split('<a class="tag"')[1]) {
      genre = entities.decode(body.split('<a class="tag"')[1].split('>')[1].split('</a')[0]);
    }
    else {
      genre = "unknown"
    }
    
    const format = parsed.map(function (item) {
      if (item && item.file && item.file["mp3-128"])
        return {
          title: item.title,
          url: item.file["mp3-128"],
          album: albumTitle,
          artist: artist,
          trackNumber: item.track_num,
          artworkURL: artworkURL,
          genre: genre
        }
    });

    if (!fs.existsSync(albumName)){
      fs.mkdirSync(`./downloads/${artist.replace(/\//g, '-')} - ${albumTitle.replace(/\//g, '-')}`);
      
      axios({method: 'get', url: artworkURL, responseType: 'stream'}).then(artwork => {
        let write = fs.createWriteStream(`./${albumName}/${artID}.jpeg`);
        artwork.data.pipe(write);

        write.on('finish', () => {
          fs.readFile(`./${albumName}/${artID}.jpeg`, function(err, data) {
            if (err) throw err;
            getTracks(data)
          });
        });
      }).catch(err => console.log(err));
    }

    function getTracks(albumArtworkBuffer) {
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
                genre: item.genre,
                trackNumber: item.trackNumber,
                comment: {
                  text: artistPage
                },
                image: {
                  mime: "jpeg",
                  type: {
                    id: 3,
                    name: "front cover"
                  },
                  imageBuffer: albumArtworkBuffer
                }
              }
              let success = NodeID3.write(tags, file);
  
              if (success===true) {
                console.log('saved: ', tags.artist, tags.title, tags.genre);
                i--;
                get(urls[i], i);

              }
              else {
                console.log('error: error saving ID3 tag for ', tags);
                i--;
                get(urls[i], i);
              }
            });
          })
          .catch(err => console.log(err));
      });
    }
}).catch(err => console.log(err))
  }
}
