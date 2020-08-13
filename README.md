It's ugly, but it works!

## Usage

There are two ways to download tracks:

# Command line argument, single url

```bash
node index.js <url>
```

URL format should be like this style 

https://secousse.bandcamp.com/album/mandinka-dong

etc.

# Batch download via batch.txt

```bash
node index.js
```

Make sure to include a batch.txt file in the root directory and follow formatting style found in the batch_example.txt

Do not include any new lines before or after the URLs or it won't work.
