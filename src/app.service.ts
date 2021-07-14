import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as qs from 'qs';
import axios from 'axios';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}
  getHello(): string {
    return 'Hello World!';
  }
  async verificationGoogle(request) {
    delete request['audience'];
    delete request['response_type'];
    const params = {
      ...request,
      client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    };
    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        qs.stringify(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
}
