Its ugly, but it works!

## Usage

There are two ways to download tracks:

# Command line argument, single url

```bash
node index.js <url>
```

URL format should be like this style 

https://secousse.bandcamp.com/album/mandinka-dong
https://maltemarten-yatao.bandcamp.com/album/the-great-pandora

etc.

# Batch download via batch.txt

```bash
node index.js
```

Make sure to include a batch.txt file in the root directory and format as follows:

https://url.com
https://url.com
https://url.com

Do not include any new lines before or after the URLs or it won't work.
