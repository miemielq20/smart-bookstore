import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AiConfigService } from './ai-config.service'
import type { ChatDto } from './dto/chat.dto'

export interface RecommendedBook {
  id: number
  title: string
  author: string
  coverUrl: string | null
  price: number
  stock: number
  rating: number | null
  description: string | null
  reading: string | null
  categories: string[]
  tags: string[]
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiConfigService: AiConfigService,
  ) {}

  async chat(dto: ChatDto) {
    const books = await this.searchBooks(dto.message, dto.excludeIds ?? [])
    const result = await this.generateReply(dto.message, books)
    const modelBooks = books
      .filter((book) => result.selectedIds.includes(book.id))
      .slice(0, 4)
    const selectedBooks = modelBooks.length ? modelBooks : books.slice(0, 4)

    return {
      reply: result.reply,
      books: selectedBooks,
      provider: result.provider,
    }
  }

  // 将模型增量内容直接转发给控制器，并在流结束后整理推荐结果。
  async streamChat(
    dto: ChatDto,
    userId: number | undefined,
    onChunk: (content: string) => void,
  ) {
    const sessionId = userId
      ? await this.ensureSession(dto.sessionId, userId, dto.message)
      : null
    if (sessionId) await this.saveMessage(sessionId, 'USER', dto.message)
    const books = await this.searchBooks(dto.message, dto.excludeIds ?? [])
    const config = await this.aiConfigService.getRuntimeConfig()
    const apiKey = config.apiKey

    if (!apiKey) {
      const reply = this.buildFallbackReply(dto.message, books)
      onChunk(reply)
      const selectedBooks = books.slice(0, 4)
      await this.saveAssistantMessage(sessionId, reply, selectedBooks)
      return { reply, books: selectedBooks, provider: 'local', sessionId }
    }

    const response = await fetch(this.aiConfigService.completionsUrl(config.baseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: this.buildPrompt(dto.message, books, config.promptTemplate) }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok || !response.body) {
      const reply = this.buildFallbackReply(dto.message, books)
      onChunk(reply)
      const selectedBooks = books.slice(0, 4)
      await this.saveAssistantMessage(sessionId, reply, selectedBooks)
      return { reply, books: selectedBooks, provider: 'local', sessionId }
    }

    let fullReply = ''
    let emittedLength = 0
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const handleEvent = (event: string) => {
      const line = event
        .split('\n')
        .find((item) => item.trim().startsWith('data:'))
      if (!line) return
      const payload = line.replace(/^\s*data:\s*/, '').trim()
      if (!payload || payload === '[DONE]') return

      const data = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>
      }
      const content = data.choices?.[0]?.delta?.content ?? ''
      if (content) {
        fullReply += content
        const selectedIdsIndex = fullReply.search(/SELECTED_IDS\s*:/i)
        const visibleReply =
          selectedIdsIndex >= 0
            ? fullReply.slice(0, selectedIdsIndex)
            : this.removePossibleSelectedIdsSuffix(fullReply)
        if (visibleReply.length > emittedLength) {
          onChunk(visibleReply.slice(emittedLength))
          emittedLength = visibleReply.length
        }
      }
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

    const selectedIds = this.parseSelectedIds(fullReply)
    const selectedBooks = books
      .filter((book) => selectedIds.includes(book.id))
      .slice(0, 4)
    const finalBooks = selectedBooks.length ? selectedBooks : books.slice(0, 4)
    const finalReply = fullReply.replace(/\s*SELECTED_IDS:\s*\[[^\]]*\]\s*$/i, '')
    await this.saveAssistantMessage(sessionId, finalReply, finalBooks)
    return {
      reply: finalReply,
      books: finalBooks,
      provider: 'deepseek',
      sessionId,
    }
  }

  // 新建或复用登录用户的会话，并更新会话标题。
  private async ensureSession(sessionId: string | undefined, userId: number, message: string) {
    if (sessionId) {
      const existing = await this.prisma.aiSessions.findFirst({
        where: { id: BigInt(sessionId), userId: BigInt(userId), deletedAt: null },
      })
      if (existing) return existing.id
    }
    const session = await this.prisma.aiSessions.create({
      data: { userId: BigInt(userId), title: message.slice(0, 200) },
    })
    return session.id
  }

  // 持久化用户消息或 AI 消息，推荐书籍 ID 记录在 JSON 字段中。
  private async saveMessage(sessionId: bigint, role: 'USER' | 'ASSISTANT', content: string, bookIds?: number[]) {
    await this.prisma.aiMessages.create({
      data: {
        sessionId,
        role,
        content,
        bookIds: bookIds ?? undefined,
      },
    })
    await this.prisma.aiSessions.update({
      where: { id: sessionId },
      data: { messageCount: { increment: 1 }, updatedAt: new Date() },
    })
  }

  private async saveAssistantMessage(sessionId: bigint | null, reply: string, books: RecommendedBook[]) {
    if (!sessionId) return
    await this.saveMessage(sessionId, 'ASSISTANT', reply, books.map((book) => book.id))
  }

  async getSessions(userId?: number) {
    if (!userId) return []
    const rows = await this.prisma.aiSessions.findMany({
      where: { userId: BigInt(userId), deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, messageCount: true, createdAt: true, updatedAt: true },
    })
    return rows.map((row) => ({ ...row, id: Number(row.id) }))
  }

  async getSession(sessionId: string, userId?: number) {
    if (!userId) return null
    const session = await this.prisma.aiSessions.findFirst({
      where: { id: BigInt(sessionId), userId: BigInt(userId), deletedAt: null },
    })
    if (!session) return null
    const messages = await this.prisma.aiMessages.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    })
    const bookIds = messages.flatMap((message) =>
      Array.isArray(message.bookIds)
        ? message.bookIds.map((id) => Number(id))
        : [],
    )
    const books = await this.prisma.books.findMany({
      where: { id: { in: bookIds.map((id) => BigInt(id)) } },
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        price: true,
        stock: true,
        rating: true,
        description: true,
        reading: true,
      },
    })
    const bookMap = new Map(books.map((book) => [Number(book.id), book]))
    return {
      id: Number(session.id),
      title: session.title,
      messages: messages.map((message) => ({
        role: message.role === 'USER' ? 'user' : 'assistant',
        content: message.content,
        bookIds: Array.isArray(message.bookIds) ? message.bookIds : [],
        books: (Array.isArray(message.bookIds) ? message.bookIds : [])
          .map((id) => bookMap.get(Number(id)))
          .filter(Boolean)
          .map((book) => ({
            ...book,
            id: Number(book!.id),
            price: Number(book!.price),
            rating: book!.rating === null ? null : Number(book!.rating),
          })),
      })),
    }
  }

  // 暂存可能是 SELECTED_IDS 标记开头的尾部，避免标记被拆包时泄漏到页面。
  private removePossibleSelectedIdsSuffix(content: string) {
    const marker = 'SELECTED_IDS:'
    const maxSuffixLength = Math.min(marker.length - 1, content.length)
    for (let length = maxSuffixLength; length > 0; length -= 1) {
      const suffix = content.slice(-length)
      if (marker.toLowerCase().startsWith(suffix.toLowerCase())) {
        return content.slice(0, -length)
      }
    }
    return content
  }

  private async searchBooks(
    message: string,
    excludeIds: number[],
  ): Promise<RecommendedBook[]> {
    const searchTerms = this.extractSearchTerms(message)
    const books = await this.prisma.books.findMany({
      where: {
        deletedAt: null,
        status: 1,
        ...(excludeIds.length
          ? { id: { notIn: excludeIds.map((id) => BigInt(id)) } }
          : {}),
      },
      orderBy: [{ salesCount: 'desc' }, { rating: 'desc' }],
      take: 80,
    })

    const bookIds = books.map((book) => book.id)
    const [categoryRelations, tagRelations] = await Promise.all([
      this.prisma.bookCategoryRelations.findMany({
        where: { bookId: { in: bookIds } },
        select: { bookId: true, categoryId: true },
      }),
      this.prisma.bookTagRelations.findMany({
        where: { bookId: { in: bookIds } },
        select: { bookId: true, tagId: true },
      }),
    ])
    const [categories, tags] = await Promise.all([
      this.prisma.categories.findMany({
        where: { id: { in: categoryRelations.map((item) => item.categoryId) } },
        select: { id: true, name: true },
      }),
      this.prisma.tags.findMany({
        where: { id: { in: tagRelations.map((item) => item.tagId) } },
        select: { id: true, name: true },
      }),
    ])
    const categoryNames = new Map(
      categories.map((item) => [item.id, item.name]),
    )
    const tagNames = new Map(tags.map((item) => [item.id, item.name]))
    const candidates = books.map((book) => ({
      id: Number(book.id),
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      price: Number(book.price ?? 0),
      stock: book.stock,
      rating: book.rating === null ? null : Number(book.rating),
      description: book.description,
      reading: book.reading,
      categories: categoryRelations
        .filter((item) => item.bookId === book.id)
        .map((item) => categoryNames.get(item.categoryId))
        .filter((name): name is string => Boolean(name)),
      tags: tagRelations
        .filter((item) => item.bookId === book.id)
        .map((item) => tagNames.get(item.tagId))
        .filter((name): name is string => Boolean(name)),
    }))

    // 没有 API Key 时也按用户问题匹配书籍字段，避免退化成固定热门书。
    const scoredBooks = candidates
      .map((book, index) => ({
        book,
        index,
        score: searchTerms.reduce(
          (score, term) =>
            score +
            (book.title.includes(term) ? 8 : 0) +
            (book.author.includes(term) ? 7 : 0) +
            (book.categories.some((item) => item.includes(term)) ? 6 : 0) +
            (book.tags.some((item) => item.includes(term)) ? 6 : 0) +
            (book.description?.includes(term) ? 4 : 0) +
            (book.reading?.includes(term) ? 4 : 0),
          0,
        ),
      }))
      .map((item) => ({
        ...item,
        score: item.score + this.getPriceScore(message, item.book.price),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)

    // 有关键词命中时只把高相关候选交给模型，避免热门排序遮蔽真正匹配的图书。
    const maxScore = scoredBooks[0]?.score ?? 0
    if (maxScore > 0) {
      return scoredBooks.slice(0, 24).map(({ book }) => book)
    }

    // 完全无命中时按问题轮换起点，保证每次提问不会永远返回数据库前四本。
    const start = this.getRotationStart(message, candidates.length)
    return [...candidates.slice(start), ...candidates.slice(0, start)].slice(
      0,
      24,
    )
  }

  // 根据用户预算描述给价格匹配图书加分。
  private getPriceScore(message: string, price: number) {
    const budget = message.match(
      /(?:低于|少于|不超过|不高于|以内|预算|价格).*?(\d+(?:\.\d+)?)|(?:\d+(?:\.\d+)?).*?(?:元以下|元以内|块以下)/,
    )
    if (budget) return price <= Number(budget[1]) ? 10 : -4
    if (/便宜|低价|平价/.test(message)) return price <= 40 ? 6 : 0
    if (/贵|高价|收藏/.test(message)) return price >= 60 ? 6 : 0
    return 0
  }

  // 用问题生成稳定轮换位置，仅用于完全无字段命中的兜底场景。
  private getRotationStart(message: string, length: number) {
    if (!length) return 0
    const hash = [...message].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return hash % length
  }

  // 提取问题中的有效词，避免把“推荐适合睡前阅读的书”整句当成关键词。
  private extractSearchTerms(message: string) {
    const stopWords = new Set([
      '推荐',
      '一下',
      '一些',
      '几本',
      '一本',
      '图书',
      '书籍',
      '书',
      '适合',
      '想看',
      '帮我',
      '请问',
      '有没有',
      '可以',
      '的',
      '吗',
      '呢',
      '啊',
    ])
    const terms: string[] = []
    const chunks =
      message.match(/[\u4e00-\u9fff]+|[a-zA-Z0-9][a-zA-Z0-9.-]*/g) ?? []

    for (const chunk of chunks) {
      if (/^[a-zA-Z0-9]/.test(chunk)) {
        if (!stopWords.has(chunk)) terms.push(chunk)
        continue
      }

      // 中文没有空格，使用二字词和三字词覆盖作者、分类、标签等常见字段。
      for (let index = 0; index < chunk.length - 1; index += 1) {
        const twoChars = chunk.slice(index, index + 2)
        const threeChars = chunk.slice(index, index + 3)
        if (!stopWords.has(twoChars)) terms.push(twoChars)
        if (threeChars.length === 3 && !stopWords.has(threeChars)) {
          terms.push(threeChars)
        }
      }
    }

    return [...new Set(terms)].filter((term) => term.length >= 2).slice(0, 20)
  }

  private async generateReply(message: string, books: RecommendedBook[]) {
    const config = await this.aiConfigService.getRuntimeConfig()
    const apiKey = config.apiKey
    if (!apiKey) {
      return {
        reply: this.buildFallbackReply(message, books),
        selectedIds: [],
        provider: 'local',
      }
    }

    const prompt = this.buildPrompt(message, books, config.promptTemplate)
    try {
      const response = await fetch(
        this.aiConfigService.completionsUrl(config.baseUrl),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: config.temperature,
            max_tokens: config.maxTokens,
          }),
          signal: AbortSignal.timeout(12000),
        },
      )
      if (!response.ok) {
        return {
          reply: this.buildFallbackReply(message, books),
          selectedIds: [],
          provider: 'local',
        }
      }
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const reply =
        data.choices?.[0]?.message?.content ||
        this.buildFallbackReply(message, books)
      const selectedIds = this.parseSelectedIds(reply)
      return {
        reply: reply.replace(/\s*SELECTED_IDS:\s*\[[^\]]*\]\s*$/i, ''),
        selectedIds,
        provider: 'deepseek',
      }
    } catch (error) {
      console.error('[AI] DeepSeek request failed, using local recommendation', error)
      return {
        reply: this.buildFallbackReply(message, books),
        selectedIds: [],
        provider: 'local',
      }
    }
  }

  // 让模型只在数据库候选图书范围内做选择。
  private buildPrompt(message: string, books: RecommendedBook[], template: string) {
    return [
      template,
      '你是智慧书城的购书助手。只能推荐下面提供的图书，不能虚构书名、作者或价格。',
      '请用简洁自然的中文回答用户，并说明推荐理由。只能从候选书籍中选择，最多选择4本。',
      '最后一行必须输出：SELECTED_IDS:[数字ID,数字ID]。如果没有合适的书，输出SELECTED_IDS:[]。',
      `用户问题：${message}`,
      `数据库图书：${JSON.stringify(books)}`,
    ].join('\n')
  }

  // 解析模型最后返回的图书 ID，只接受数据库候选集中的数字。
  private parseSelectedIds(reply: string) {
    const match = reply.match(/SELECTED_IDS:\s*\[([^\]]*)\]/i)
    if (!match) return []
    return [...new Set((match[1].match(/\d+/g) ?? []).map(Number))].slice(0, 4)
  }

  private buildFallbackReply(message: string, books: RecommendedBook[]) {
    if (!books.length) return `暂时没有找到与“${message}”相关的在售图书。`
    return `根据“${message}”，为你找到 ${books.length} 本数据库中的图书，可以先从下面的推荐开始看看。`
  }
}
