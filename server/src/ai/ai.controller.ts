import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import type { Request } from 'express'
import { AiService } from './ai.service'
import { ChatDto } from './dto/chat.dto'
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard'

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // AI 助手允许游客使用，但推荐结果始终来自数据库。
  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.aiService.chat(dto)
  }

  // 使用 SSE 将 DeepSeek 的增量内容实时推送给前端。
  @Post('chat/stream')
  @UseGuards(OptionalJwtAuthGuard)
  async streamChat(
    @Body() dto: ChatDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    response.status(200)
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()

    const send = (data: Record<string, unknown>) => {
      response.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    try {
      const user = request.user as { userId?: number } | undefined
      const result = await this.aiService.streamChat(
        dto,
        user?.userId,
        (content) => send({ type: 'delta', content }),
      )
      send({ type: 'done', ...result })
    } catch (error) {
      console.error('[AI] stream request failed', error)
      send({ type: 'error', message: 'AI 服务暂时不可用，请稍后再试' })
    } finally {
      response.end()
    }
  }

  // 获取当前商城用户的历史会话列表。
  @Get('sessions')
  @UseGuards(OptionalJwtAuthGuard)
  async sessions(@Req() request: Request) {
    const user = request.user as { userId?: number } | undefined
    return this.aiService.getSessions(user?.userId)
  }

  // 获取指定会话的完整消息记录。
  @Get('sessions/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async session(@Req() request: Request, @Param('id') id: string) {
    const user = request.user as { userId?: number } | undefined
    return this.aiService.getSession(id, user?.userId)
  }
}
