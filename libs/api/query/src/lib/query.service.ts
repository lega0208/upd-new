import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService {
  getData() {
    return 'Hello World!';
  }
}
