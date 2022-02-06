import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format, addSeconds, parse } from 'date-fns';
import * as readline from 'readline';
import * as fs from 'fs';
import * as cp from 'child_process';
// import { execa as cp } from 'execa';
import * as ytdl from 'ytdl-core';
import * as ffmpeg from 'ffmpeg-static';

@Injectable()
export class YoutubeService {
  limitSecond = 25;
  constructor(private configService: ConfigService) {}
  async downloadYoutube(
    url: string,
    durationVideo = 15,
    timeStart = '00:01:00',
  ) {
    console.log('url: ', url);
    const duration =
      durationVideo && durationVideo > this.limitSecond
        ? this.limitSecond
        : durationVideo;
    const videoId = this.getVideoId(url);
    const rootYoutubeDir = `${__dirname}/youtube/`;
    if (!fs.existsSync(rootYoutubeDir)) {
      fs.mkdirSync(rootYoutubeDir);
    }
    const videoFolder = `${rootYoutubeDir}/${videoId}`;
    if (!fs.existsSync(videoFolder)) {
      fs.mkdirSync(videoFolder);
    }

    const videoInfo = await ytdl.getInfo(videoId);
    const videoDetail = videoInfo.videoDetails;
    const lengthSecond = Math.floor(+videoDetail.lengthSeconds / 60);
    console.log('videoInfo: ', lengthSecond);

    const dayTime = parse(
      '2019-11-27 00:00:00',
      'yyyy-MM-dd HH:mm:ss',
      new Date(),
    );
    const time = addSeconds(dayTime, duration);
    const timeDuration = format(time, 'HH:mm:ss');
    console.log('timeDuration: ', timeDuration);
    const tmpOutput = `${videoFolder}/${videoId}_tmp.mp4`;
    const outputTmpFile = `${videoFolder}/${videoId}.mp4`;
    const video = await ytdl(url);

    process.stdout.write('downloading video...');
    await video.on('progress', (chunkLength, downloaded, total) => {
      const percent = downloaded / total;
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `downloading video... ${(percent * 100).toFixed(2)}%`,
      );
    });
    return new Promise((resolve, reject) => {
      video.pipe(fs.createWriteStream(tmpOutput)).on('finish', () => {
        try {
          const ffmpegProcess = cp.spawn(
            ffmpeg,
            [
              '-y',
              '-v',
              'error',
              '-progress',
              'pipe:3',
              '-i',
              tmpOutput,
              '-vcodec',
              'copy',
              '-acodec',
              'copy',
              '-ss',
              timeStart,
              '-t',
              timeDuration,
              '-f',
              'matroska',
              'pipe:4',
            ],
            {
              windowsHide: true,
              stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe'],
            },
          );

          process.stdout.write('\n');
          ffmpegProcess.stdio[3].on('data', (chunk) => {
            readline.cursorTo(process.stdout, 0);
            const args = chunk
              .toString()
              .trim()
              .split('\n')
              .reduce((acc, line) => {
                const parts = line.split('=');
                acc[parts[0]] = parts[1];
                return acc;
              }, {});
            process.stdout.write(
              `cutting video... ${args.progress}${' '.repeat(3)}`,
            );
          });

          ffmpegProcess.on('close', () => {
            process.stdout.write(`\nsaved to ${outputTmpFile}\n`);
            resolve(outputTmpFile);
            try {
              fs.unlinkSync(tmpOutput);
              //file removed
            } catch (err) {
              console.error(err);
            }
          });

          ffmpegProcess.stdio[4].pipe(fs.createWriteStream(outputTmpFile));
        } catch (error) {
          console.log(error);
        }
      });
    });
  }
  private getVideoId(url: string): string {
    const results = url.match('[\\?&]v=([^&#]*)');
    const videoId = results === null ? url : results[1];
    return videoId;
  }
  async getInfoVideo(url: string) {
    const videoId = this.getVideoId(url);
    const videoInfo = await ytdl.getInfo(videoId);
    const videoDetail = videoInfo.videoDetails;
    return videoDetail;
  }
}
