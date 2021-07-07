// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const P2P = require("pipe2pam");
const PD = require("pam-diff");
const CP = require("child_process");
const config = require("./config");
const logger = require("./logger");
const fs = require("fs");

const spawn = CP.spawn;

function motionDetect(motion, p2p, pd) {
    if (motion) {
        const basePath = config.basePath;
        //change this to /dev/shm/manifest.m3u8
        const pathToHLS = config.pathToHLS;
        //const pathToHLS = "/dev/shm/manifest.m3u8";
        const timeout = Number.parseInt(config.MOTION_DURATION) * 1000;
        //10000 = 10 seconds of recorded video, includes buffer of time before motion triggered recording
        //set the directory for the jpegs and mp4 videos to be saved
        const percent = Number.parseInt(config.MOTION_PERCENT);
        const diff = Number.parseInt(config.MOTION_DIFF);
        const motionTimeout = Number.parseInt(config.MOTION_TIMEOUT);

        let recordingStopper = null; //timer used to finish the mp4 recording with sigint after enough time passed with no additional motion events
        let motionRecorder = null; //placeholder for spawned ffmpeg process that will record video to disc
        let bufferReady = false; //flag to allow time for video source to create manifest.m3u8

        function setTimeoutCallback() {
            if (motionRecorder && motionRecorder.kill(0)) {
                motionRecorder.kill();
                motionRecorder = null;
                recordingStopper = null;
            }
            start = true;
            logger.log("recording finished");
        }

        logger.log("start motion detector");
        var start = true;
        var beginTime;
        p2p = new P2P();
        p2p.on("pam", (data) => {
            // console.log(data);
            //  console.log('get image frame');
        });
        pd = new PD({difference: diff, percent: percent}).on("diff", (data) => {
            //console.log("diff");

            if (fs.existsSync(pathToHLS) !== true) {
                return;
            }
            //wait just a moment to give ffmpeg a chance to write manifest.mpd
            if (bufferReady === false) {
                bufferReady = true;
                return;
            }
            if (recordingStopper === null) {
                const date = new Date();
                let name = `${date.getFullYear()}-${date.getMonth() + 1
                }-${date.getDate()}_${("0" + date.getHours()).substr(-2)}-${(
                    "0" + date.getMinutes()
                ).substr(-2)}-${("0" + date.getSeconds()).substr(-2)}-${(
                    "00" + date.getMilliseconds()
                ).substr(-3)}`;
                for (const region of data.trigger) {
                    name += `_${region.name}-${region.percent}_`;
                }
                const jpeg = `${name}.jpeg`;
                const jpegPath = `${basePath}/record/${config.streamChannel}/motion/images/${jpeg}`;
                //logger.log(jpegPath);
                const mp4 = `${name}.mp4`;
                const mp4Path = `${basePath}/record/${config.streamChannel}/motion/mp4/${mp4}`;
                //logger.log(mp4Path);
                motionRecorder = spawn(
                    "ffmpeg",
                    [
                        "-loglevel",
                        "info",
                        "-f",
                        "pam_pipe",
                        "-c:v",
                        "pam",
                        "-i",
                        "pipe:0",
                        "-re",
                        "-i",
                        pathToHLS,
                        "-map",
                        "1:v",
                        //   "-an",
                        // "-c:v",
                        // "copy",
                        //         "-s","320x240",
                        "-movflags",
                        "+faststart+empty_moov",
                        mp4Path,
                        "-map",
                        "0:v",
                        "-an",
                        "-c:v",
                        "mjpeg",
                        "-pix_fmt",
                        "yuvj422p",
                        "-q:v",
                        "1",
                        "-huffman",
                        "optimal",
                        jpegPath,
                    ],
                    {stdio: ["pipe", "pipe", "ignore"]}
                )
                    .on("error", (error) => {
                        logger.log(error);
                    })
                    .on("exit", (code, signal) => {
                        if (code !== 0 && code !== 255) {
                            logger.log("motionRecorder", code, signal);
                            motionRecorder = null;
                            recordingStopper = null;
                        }
                    });
                motionRecorder.stdin.end(data.pam);
                recordingStopper = setTimeout(setTimeoutCallback, timeout);
                logger.log(`recording started for video ${mp4}`);
            } else {
                if (start === true) {
                    beginTime = Date.now();
                    start = false;
                }
                var interval = (Date.now() - beginTime) / 1000;
                // console.log("interval---" + interval);
                if (interval < motionTimeout) {
                    logger.log(
                        `due to continued motion, recording has been extended by ${timeout / 1000
                        } seconds from now`
                    );
                    clearTimeout(recordingStopper);
                    recordingStopper = setTimeout(setTimeoutCallback, timeout);
                } else {
                    clearTimeout(recordingStopper);
                    setTimeoutCallback();
                }
            }
        });
    }
    return {p2p, pd};
}

module.exports = {
    motionDetect
};