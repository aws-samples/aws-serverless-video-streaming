// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const download = require('image-downloader');
const { waterMarkFontColor } = require('./config');
const config = require('./config')

const imageName=config.ImageURL.split("/").pop()
const imagePath = config.basePath +'/'+ imageName

var functions = {};

functions.downloadImage = async() => {
    const options = {
        url: config.ImageURL,
        dest: imagePath               // will be saved to /path/to/dest/image.jpg
    }
  await  download.image(options)
        .then(({ filename }) => {
            console.log('Saved to', filename)  // saved to /path/to/dest/image.jpg
            return filename;
        })
        .catch((err) => console.error(err))
}

module.exports = functions;