const PORT = 8000

const axios = require('axios')
const cheerio = require('cheerio')
const express = require('express')
const cors = require('cors')
const path = require('path')
const http = require('https');
const fs = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');
const { exec } = require("child_process");

ffmpeg.setFfprobePath(ffprobe.path);
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
var video_status = true;
var audio_status = true;

const config = {
    headers: {
        "referer": "https://www.bilibili.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"

    }
}

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }));

//https://www.bilibili.com/video/BV1Z24y1V7a4
var url = ''
var status;

const static_path = path.join(__dirname, "public");
app.use(express.static(static_path));
app.use(express.urlencoded({ extended: true }));

app.get('/results', (req, res) => {
    axios(url, config)
        .then(response => {
            const html = response.data
            const $ = cheerio.load(html)
            const match_playinfo = /window.__playinfo__=(.*?)<\/script>/g
            const result = [...html.toString().matchAll(match_playinfo)][0][1]
            var video_info = {}
            if (result != null) {
                console.log("Matched");

                const timelength = [...result.matchAll(/"timelength":(.*?),/g)][0][1];
                const quality = [...result.matchAll(/"accept_description":(.*?)]/g)][0][1].slice(1);
                const match_base_url = /"baseUrl":"(.*?)"/g
                const result_base_url = [...result.toString().matchAll(match_base_url)][0][1]

                const match_audio = /"audio":(.*?)}]/g
                const result_audio = [...result.toString().matchAll(match_audio)][0][1]
                const result_audio_url = [...result_audio.matchAll(/"baseUrl":"(.*?)"/g)][0][1]

                console.log(result_audio_url)
                console.log(result_base_url)
                status = true;
                video_info = {
                    timelength: timelength,
                    quality: quality,
                    status: status,
                    download_status: false
                }

                const video_file = fs.createWriteStream("video.mp4");
                const audio_file = fs.createWriteStream("audio.mp3");
                const video_request = http.get(result_base_url, function (response) {
                    response.pipe(video_file);
                    video_file.on("finish", () => {
                        video_file.close();
                        video_info.download_status = true;
                        console.log("Video Download Completed");
                        //processVideo('video.mp4');
                        video_status = true;
                        // merge('video.mp4', 'audio.mp4');
                    });
                });
                const audio_request = http.get(result_audio_url, function (response) {
                    response.pipe(audio_file);
                    audio_file.on("finish", () => {
                        audio_file.close();
                        video_info.download_status = true;
                        console.log("Audio Download Completed");
                        audio_status = true;
                    });
                });
                //console.log(result_base_url);
            } else {
                video_info = {
                    status: status
                }
                status = false;
                console.log("Not Matched");
            }

            res.json(video_info)
        }).catch(err => console.log(err))

})

app.get('/status', (req, res) => {
    if (status) {
        res.json({ status: status })
    } else {
        res.json({ status: status })
    }
});

app.get('/download', function (req, res) {
    const file = './video.mp4';
    res.download(file);
});

// Handling request 
app.post("/request", (req, res) => {
    console.log(req.body.name);
    if (req.body.name.toString().includes("bilibili")) {
        url = req.body.name.toString();
    } else {
        console.log("Please use Bilibili URL");
    }
})

app.post("/merge", (req, res) => {
    if (video_status && audio_status) {
        console.log("Merging");
        /*
        let cmd = 'ffmpeg -i audio.mp3 -i video.mp4 -filter_complex "[0:a][1:a]amerge,pan=stereo|c0<c0+c2|c1<c1+c3[out]" -map 1:v -map "[out]" -c:v copy -shortest output.mp4'
        exec(cmd, function (err, stdout, stderr) {
            if (err) console.log(err)
            else console.log("Done!")
        })*/
        /*
                var proc = ffmpeg()
                    .input("./video.mp4")
                    .input("./audio.mp3")
                    .complexFilter([
                        {
                            filter: 'amix', options: { inputs: 2, duration: 'longest' }
                        }
                    ])
                    .on('end', async function (output) {
                        console.log(output, 'files have been merged and saved.')
                    })
                    .saveToFile("./file_name.mp4")
        */
        //merge('video.mp4', 'audio.mp3');
    } else {
        console.log("Need generate first");
    }
});

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))

function processVideo(videoFile) {
    ffmpeg.ffprobe(videoFile, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    });
}

