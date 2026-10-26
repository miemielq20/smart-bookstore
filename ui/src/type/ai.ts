export interface AiConfig {
  ai_model: string
  ai_api_key: string
  ai_api_base_url: string
  ai_temperature: number
  ai_max_tokens: number
  ai_prompt_template: string
  hasApiKey: boolean
}

export interface AiConfigUpdate {
  ai_model: string
  ai_api_key: string
  ai_api_base_url: string
  ai_temperature: number
  ai_max_tokens: number
  ai_prompt_template: string
}

export interface AiTestResult {
  success: boolean
  response: string
  latency_ms: number
}
