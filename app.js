const PORT = 8000

const axios = require('axios')
const express = require('express')
const cors = require('cors')
const path = require('path')
const http = require('https');
const fs = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');
const { clearScreenDown } = require('readline')

ffmpeg.setFfprobePath(ffprobe.path);
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
var video_status = false;
var audio_status = false;
var status = false;

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
var url = 'default'

const static_path = path.join(__dirname, "public");
app.use(express.static(static_path));
app.use(express.urlencoded({ extended: true }));

app.get('/results', (req, res) => {
    axios(url, config)
        .then(response => {
            video_status = false;
            audio_status = false;
            status = false;
            url = 'default';
            const html = response.data;
            const html_str = html.toString();
            const title_match = /<title data-vue-meta="true">(.*?)<\/title>/g;
            var title = [...html_str.matchAll(title_match)][0][1];
            title = title.substring(0, title.length - 14);

            const author_match = /<meta data-vue-meta="true" itemprop="author" name="author" content="(.*?)">/g;
            var author = [...html_str.matchAll(author_match)][0][1];

            const match_playinfo = /window.__playinfo__=(.*?)<\/script>/g
            const result = [...html_str.matchAll(match_playinfo)][0][1]
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
                video_info = {
                    title: title,
                    author: author,
                    timelength: timelength,
                    quality: quality,
                    status: true
                }
                console.log(video_info)
                const video_file = fs.createWriteStream("video.mp4");
                const audio_file = fs.createWriteStream("audio.mp3");
                const video_request = http.get(result_base_url, config, function (response) {
                    response.pipe(video_file);
                    video_file.on("finish", () => {
                        video_file.close();
                        video_info.download_status = true;
                        console.log("Video Download Completed");
                        video_status = true;
                    });
                });
                const audio_request = http.get(result_audio_url, config, function (response) {
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
            res.json(video_info);
        }).catch(err => console.log(err))

})

app.get('/status', (req, res) => {
    res.json({
        download_status: video_status && audio_status,
        status: status
    });
});

app.get('/download', function (req, res) {
    const file = './output.mp4';
    res.download(file);
    status = true;
    video_status = false;
    audio_status = false;
});

// Handling request 
app.post("/request", (req, res) => {
    console.log(req.body.name);
    if (req.body.name.toString().includes("bilibili")) {
        status = req.status;
        url = req.body.name.toString();
        return res.json({ status: true });
    } else {
        return res.json({ status: false });
    }
})

app.post("/merge", (req, res) => {
    const outputFile = './output.mp4';
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
    }
    if (video_status && audio_status) {
        console.log("Merging");
        // Adapted from: https://gist.github.com/DusanBrejka/16153fcb757fd9954e94a404d79a2b23
        const ffmpeg_exec = args => {
            let cmd = ffmpeg().output(' ');
            cmd._outputs[0].isFile = false;
            cmd._outputs[0].target = "";
            cmd._global.get = () => {
                return typeof args === "string" ? args.split(' ') : args;
            };
            return cmd;
        };

        ffmpeg_exec('-i video.mp4 -stream_loop -1 -i audio.mp3 -c copy -shortest -map 0:v:0 -map 1:a:0 output.mp4')
            .on('start', cmdLine => console.log('start', cmdLine))
            .on('codecData', codecData => console.log('codecData', codecData))
            .on('error', error => console.log('error', error))
            .on('stderr', stderr => console.log('stderr', stderr))
            .run();

        var checkMerge = setInterval(() => {
            if (fs.existsSync(outputFile)) {
                res.redirect('/download');
                clearInterval(checkMerge);
            }
        }, 1000);
    } else {
        console.log("Can't find video or audio");
    }
});

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))
