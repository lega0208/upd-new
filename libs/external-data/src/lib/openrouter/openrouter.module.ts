import { Module } from '@nestjs/common';
import { OpenRouterClient } from './openrouter.client';

@Module({
  providers: [OpenRouterClient],
  exports: [OpenRouterClient],
})
export class OpenRouterModule {}