import { request } from './request'
import type { ApiResponse } from '../types/response'

export interface AiBookRecommendation {
  id: number
  title: string
  author: string
  coverUrl: string | null
  price: number
  stock: number
  rating: number | null
  description: string | null
  reading: string | null
}

export interface AiChatResponse {
  reply: string
  books: AiBookRecommendation[]
  provider?: string
  sessionId?: number | string | null
}

export interface AiConversationSummary {
  id: number
  title: string | null
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface AiConversationDetail {
  id: number
  title: string | null
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    bookIds: number[]
    books: AiBookRecommendation[]
  }>
}

// 调用 AI 助手，返回模型回复和数据库中的真实图书。
export const chatAiApi = (message: string, excludeIds: number[] = []) =>
  request<AiChatResponse, { message: string; excludeIds?: number[] }>({
    url: '/ai/chat',
    method: 'POST',
    data: { message, excludeIds },
  })

// 读取登录用户的历史 AI 会话。
export const getAiSessionsApi = () =>
  request<ApiResponse<AiConversationSummary[]>>({ url: '/ai/sessions' })

// 读取某个历史会话的完整消息。
export const getAiSessionApi = (id: number) =>
  request<ApiResponse<AiConversationDetail>>({ url: `/ai/sessions/${id}` })

// 消费后端 SSE 流，模型产生一段就立即交给页面渲染。
export async function streamAiChat(
  message: string,
  excludeIds: number[] = [],
  onChunk: (content: string) => void,
  sessionId?: string,
) {
  const token = uni.getStorageSync('token')
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, excludeIds, sessionId }),
  })

  if (!response.ok || !response.body) {
    throw new Error('AI 服务暂时不可用')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: AiChatResponse = { reply: '', books: [] }

  const handleEvent = (event: string) => {
    const line = event
      .split('\n')
      .find((item) => item.trim().startsWith('data:'))
    if (!line) return
    const payload = line.replace(/^\s*data:\s*/, '').trim()
    if (!payload) return
    const data = JSON.parse(payload) as {
      type: 'delta' | 'done' | 'error'
      content?: string
      reply?: string
      books?: AiBookRecommendation[]
      provider?: string
      sessionId?: number | string | null
      message?: string
    }
    if (data.type === 'delta' && data.content) onChunk(data.content)
    if (data.type === 'done') {
      result = {
        reply: data.reply ?? '',
        books: data.books ?? [],
        provider: data.provider,
        sessionId: data.sessionId,
      }
    }
    if (data.type === 'error') throw new Error(data.message ?? 'AI 服务暂时不可用')
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const event of events) handleEvent(event)
    if (done) break
  }
  if (buffer.trim()) handleEvent(buffer)
  return result
}
