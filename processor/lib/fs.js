// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const fs = require('fs');
const path = require("path")

const functions = {};

functions.readdir = (dirPath, options) => new Promise((resolve, reject) => {
  fs.readdir(dirPath, options, (err, files) => {
    if (err) return reject(err);
    return resolve(files);
  });
});

functions.writeFile = (file, data) => new Promise((resolve, reject) => {
  fs.writeFile(file, data, { encoding: 'utf8' }, (err) => {
    if (err) return reject(err);
    return resolve();
  });
});

functions.readFile = (file) => new Promise((resolve, reject) => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return reject(err);
    return resolve(data);
  });
});

functions.createReadStream = (file) =>
  fs.createReadStream(file);

functions.rename = (oldPath, newPath) => new Promise((resolve, reject) => {
  fs.rename(oldPath, newPath, (err) => {
    if (err) return reject(err);
    return resolve();
  });
});

functions.mkdir = (path, options) => new Promise((resolve, reject) => {
  fs.mkdir(path, options, (err) => {
    if (err) return reject(err);
    return resolve();
  });
});

functions.unlink = (file) => new Promise((resolve, reject) => {
  fs.unlink(file, (err) => {
    if (err) return reject(err);
    return resolve();
  });
});




functions.rmdirSync = (path) => {
  if (fs.existsSync(path)) {
    try {
      console.log(`begin to delete ${path}!`);
      fs.rmdirSync(path, { recursive: true });
      console.log(`${path} is deleted!`);
    } catch (err) {
      console.error(`Error while deleting ${path}.`);
    }
  }
};


functions.rmFile = (path) => {
  console.log('---delete file' + path);
  if (fs.existsSync(path)) {
    fs.unlinkSync(path, function (error) {
      if (error) {
        console.log(error);
        return false;
      }
      console.log('---delete file' + path);
    })
  }
}

functions.exists = (file) => new Promise((resolve) => {
  fs.access(file, fs.constants.F_OK, (err) => {
    resolve(!err);
  });
});



module.exports = functions;
