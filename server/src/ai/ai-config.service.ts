import { Injectable } from '@nestjs/common';
import { SystemConfigsType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAiConfigDto } from './dto/admin-ai-config.dto';

export const AI_CONFIG_KEYS = [
  'ai_model',
  'ai_api_key',
  'ai_api_base_url',
  'ai_temperature',
  'ai_max_tokens',
  'ai_prompt_template',
] as const;

export type AiConfigKey = (typeof AI_CONFIG_KEYS)[number];

export interface AiRuntimeConfig {
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  promptTemplate: string;
}

const DEFAULT_PROMPT =
  '你是一个专业的图书推荐助手。你了解各类图书的内容特点，能根据用户的阅读偏好提供个性化推荐。';

/** 读取和保存后台 AI 配置，并为对话服务提供统一的运行时配置。 */
@Injectable()
export class AiConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getRuntimeConfig(): Promise<AiRuntimeConfig> {
    const values = await this.getStoredValues();
    return {
      model:
        values.ai_model?.trim() ||
        process.env.DEEPSEEK_MODEL?.trim() ||
        'deepseek-chat',
      apiKey:
        values.ai_api_key?.trim() || process.env.DEEPSEEK_API_KEY?.trim() || '',
      baseUrl:
        values.ai_api_base_url?.trim() ||
        process.env.DEEPSEEK_API_BASE_URL?.trim() ||
        'https://api.deepseek.com/v1',
      temperature: this.parseNumber(values.ai_temperature, 0.7, 0, 2),
      maxTokens: Math.round(
        this.parseNumber(values.ai_max_tokens, 2048, 1, 32768),
      ),
      promptTemplate: values.ai_prompt_template?.trim() || DEFAULT_PROMPT,
    };
  }

  async getPublicConfig() {
    const config = await this.getRuntimeConfig();
    return {
      ai_model: config.model,
      ai_api_key: this.maskApiKey(config.apiKey),
      ai_api_base_url: config.baseUrl,
      ai_temperature: config.temperature,
      ai_max_tokens: config.maxTokens,
      ai_prompt_template: config.promptTemplate,
      hasApiKey: Boolean(config.apiKey),
    };
  }

  async updateConfig(dto: AdminAiConfigDto, updatedBy?: number) {
    const updates: Array<{
      key: AiConfigKey;
      value: string;
      type: SystemConfigsType;
      label: string;
    }> = [];

    this.addUpdate(
      updates,
      'ai_model',
      dto.ai_model,
      SystemConfigsType.STRING,
      'AI 模型名称',
    );
    // 空 API Key 表示“留空则不修改”，避免管理员加载页面后误清除密钥。
    if (dto.ai_api_key?.trim()) {
      this.addUpdate(
        updates,
        'ai_api_key',
        dto.ai_api_key.trim(),
        SystemConfigsType.STRING,
        'AI API Key',
      );
    }
    this.addUpdate(
      updates,
      'ai_api_base_url',
      dto.ai_api_base_url,
      SystemConfigsType.STRING,
      'AI API 地址',
    );
    this.addUpdate(
      updates,
      'ai_temperature',
      dto.ai_temperature,
      SystemConfigsType.NUMBER,
      '生成温度',
    );
    this.addUpdate(
      updates,
      'ai_max_tokens',
      dto.ai_max_tokens,
      SystemConfigsType.NUMBER,
      '最大输出 Token',
    );
    this.addUpdate(
      updates,
      'ai_prompt_template',
      dto.ai_prompt_template,
      SystemConfigsType.STRING,
      'AI 提示词模板',
    );

    if (updates.length) {
      const updatedAt = new Date();
      await this.prisma.$transaction(
        updates.map((item) =>
          this.prisma.systemConfigs.upsert({
            where: { key: item.key },
            update: {
              value: item.value,
              type: item.type,
              group: 'ai',
              label: item.label,
              updatedBy:
                updatedBy === undefined ? undefined : BigInt(updatedBy),
              updatedAt,
            },
            create: {
              key: item.key,
              value: item.value,
              type: item.type,
              group: 'ai',
              label: item.label,
              updatedBy:
                updatedBy === undefined ? undefined : BigInt(updatedBy),
            },
          }),
        ),
      );
    }

    return this.getPublicConfig();
  }

  async testConnection() {
    const startedAt = Date.now();
    const config = await this.getRuntimeConfig();

    if (!config.apiKey) {
      return {
        success: false,
        response: '请先配置 API Key',
        latency_ms: Date.now() - startedAt,
      };
    }

    try {
      const response = await fetch(this.completionsUrl(config.baseUrl), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: '请只回复：连接成功' }],
          temperature: 0,
          max_tokens: 16,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return {
          success: false,
          response: this.providerError(response.status),
          latency_ms: Date.now() - startedAt,
        };
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return {
        success: true,
        response: data.choices?.[0]?.message?.content?.trim() || '连接成功',
        latency_ms: Date.now() - startedAt,
      };
    } catch (error) {
      console.error('[AI] connection test failed', error);
      return {
        success: false,
        response: '连接失败，请检查 API 地址和 API Key',
        latency_ms: Date.now() - startedAt,
      };
    }
  }

  completionsUrl(baseUrl: string) {
    const normalized = baseUrl.trim().replace(/\/+$/, '');
    return normalized.endsWith('/chat/completions')
      ? normalized
      : `${normalized}/chat/completions`;
  }

  private async getStoredValues() {
    const rows = await this.prisma.systemConfigs.findMany({
      where: { group: 'ai', key: { in: [...AI_CONFIG_KEYS] } },
      select: { key: true, value: true },
    });
    return Object.fromEntries(
      rows.map((row) => [row.key, row.value]),
    ) as Partial<Record<AiConfigKey, string>>;
  }

  private addUpdate<T extends string | number>(
    updates: Array<{
      key: AiConfigKey;
      value: string;
      type: SystemConfigsType;
      label: string;
    }>,
    key: AiConfigKey,
    value: T | undefined,
    type: SystemConfigsType,
    label: string,
  ) {
    if (value === undefined || (typeof value === 'string' && !value.trim()))
      return;
    updates.push({ key, value: String(value), type, label });
  }

  private parseNumber(
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
  ) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  private maskApiKey(value: string) {
    if (!value) return '';
    if (value.length <= 7) return '****';
    return `${value.slice(0, 3)}****${value.slice(-4)}`;
  }

  private providerError(status: number) {
    if (status === 401) return 'API Key 无效或已过期';
    if (status === 404) return 'API 地址或模型不存在';
    if (status === 429) return '请求过于频繁，请稍后再试';
    return `AI 服务返回错误（${status}）`;
  }
}
