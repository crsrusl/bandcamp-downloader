const fs = require('fs');
const axios = require('axios');
const NodeID3 = require('node-id3');
const cheerio = require('cheerio')
const batchPath = './batch.txt'
let urls;

if (fs.existsSync(batchPath)) {
    fs.readFile(batchPath, 'utf8', (err, data) => {
        if (err) throw err;
        urls = data.split('\n');
        get(urls[urls.length - 1], urls.length);
    });
} else {
    console.log('No batch.txt');
    process.exit(1);
}

function get(artistPage, i) {
    if (i < 0) {
        console.log('Finished');
    } else {
        axios.get(artistPage, {responseType: 'text'}).then(function (response) {
            const $ = cheerio.load(response.data);
            const trackData = JSON.parse($('script[data-tralbum]').attr('data-tralbum'));
            const albumName = `./downloads/${trackData.artist.replace(/\//g, '-')} - ${trackData.current.title.replace(/\//g, '-')}`;
            const trackList = createTrackList(trackData);
            const artID = trackData.current.art_id;
            const artworkURL = `https://f4.bcbits.com/img/a${artID}_16.jpg`;

            if (!fs.existsSync(albumName)) {
                fs.mkdirSync(albumName);

                axios({method: 'get', url: artworkURL, responseType: 'stream'}).then(artwork => {
                    let write = fs.createWriteStream(`./${albumName}/${artID}.jpeg`);
                    artwork.data.pipe(write);

                    write.on('finish', () => {
                        fs.readFile(`./${albumName}/${artID}.jpeg`, function (err, albumArtworkBuffer) {
                            if (err) throw err;
                            getTracks(trackList, albumArtworkBuffer)
                        });
                    });
                }).catch(err => console.log(err));
            }

            function getTracks(trackList, albumArtworkBuffer) {
                trackList.forEach(function (item) {
                    if (item) {
                        axios({method: 'get', url: item.url, responseType: 'stream'}).then(function (response) {
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
                                    },
                                    image: {
                                        mime: "jpeg",
                                        type: {
                                            id: 3,
                                            name: "front cover"
                                        },
                                        imageBuffer: albumArtworkBuffer
                                    },
                                    artistUrl: artistPage,
                                    commercialUrl: artistPage
                                }
                                let success = NodeID3.write(tags, file);

                                if (success === true) {
                                    console.log('saved: ', tags.artist, tags.title);
                                    i--;
                                    get(urls[i], i);

                                } else {
                                    console.log('error: error saving ID3 tag for ', tags);
                                    i--;
                                    get(urls[i], i);
                                }
                            });
                        }).catch(err => console.log(err));
                    }
                });
            }
        }).catch(err => console.log(err))
    }
}

function createTrackList(trackData) {
    const artist = trackData.artist;
    const albumTitle = trackData.current.title;

    return trackData.trackinfo.map(function (item) {
        if (item && item.file && item.file["mp3-128"])
            return {
                title: item.title,
                url: item.file["mp3-128"],
                album: albumTitle,
                artist: artist,
                trackNumber: item.track_num,
            }
    });
}
