import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard'
import { AdminAiController } from './admin-ai.controller'
import { AiConfigService } from './ai-config.service'

@Module({
  controllers: [AiController, AdminAiController],
  providers: [AiService, AiConfigService, OptionalJwtAuthGuard],
})
export class AiModule {}
