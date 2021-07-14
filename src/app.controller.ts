import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { YoutubeService } from './youtube.service';
import * as request from 'request';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly youtubeService: YoutubeService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/verification-google-code')
  verificationGoogle(@Req() req) {
    return this.appService.verificationGoogle(req.body);
  }

  @Post('/youtube-process')
  async youtubeDownload(@Req() req) {
    const { url, duration } = req.body;
    console.log('req.body: ', req.body);
    await this.youtubeService.downloadYoutube(url, duration);
    return 'success';
  }

  @Post('/info-video')
  getVideoDetail(@Req() req) {
    const { url } = req.body;
    return this.youtubeService.getInfoVideo(url);
  }

  @Get('/video/:videoId')
  getVideo(@Param('videoId') videoId: string, @Res() res) {
    const folder = videoId.replace('.mp4', '');
    res.sendFile(`${folder}/${videoId}`, {
      root: './dist/youtube',
    });
  }
  @Get('/ytubeimg/:url')
  getImg(@Param('url') url: string, @Res() res, @Req() req) {
    // const { url } = req.body;
    // res.send(url);
    const decodeUrl = decodeURIComponent(url);
    console.log('decodeUrl: ', decodeUrl);
    request(
      {
        url: decodeUrl,
        encoding: null,
      },
      (err, resp, buffer) => {
        if (!err && resp.statusCode === 200) {
          res.set('Content-Type', 'image/jpeg');
          res.send(resp.body);
        }
      },
    );
  }
}
