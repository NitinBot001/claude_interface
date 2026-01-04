export const MODELS = [
  { 
    label: "OpenAI", 
    options: [
      { value: "gpt-5.2-2025-12-11", label: "GPT-5.2" },
      { value: "gpt-5.2-chat-latest", label: "GPT-5.2 Chat" },
      { value: "openrouter:openai/gpt-oss-120b:free", label: "GPT OSS 120b" },
      { value: "openrouter:openai/gpt-oss-20b:free", label: "GPT OSS 20b" },
      { value: "gpt-5.1", label: "GPT-5.1" },
      { value: "gpt-5.1-chat-latest", label: "GPT-5.1 Chat" },
      { value: "gpt-5-chat-latest", label: "GPT-5 Chat" },
      { value: "gpt-5-2025-08-07", label: "GPT-5 (Aug 2025)" },
      { value: "gpt-5-mini-2025-08-07", label: "GPT-5 Mini" },
      { value: "gpt-5-nano-2025-08-07", label: "GPT-5 Nano" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
      { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
      { value: "o4-mini", label: "o4-mini" },
      { value: "o3", label: "o3" },
      { value: "o3-mini", label: "o3-mini" },
      { value: "o1", label: "o1" }
    ]
  },
  { 
    label: "Anthropic", 
    options: [
      { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (Latest)" },
      { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5" },
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
      { value: "claude-opus-4-1-20250805", label: "Claude Opus 4.1" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
      { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
      { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
    ]
  },
  { 
    label: "Google", 
    options: [
      { value: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
    ]
  },
  { 
    label: "xAI Grok", 
    options: [
      { value: "grok-3", label: "Grok-3" },
      { value: "grok-3-fast", label: "Grok-3 Fast" },
      { value: "grok-3-mini", label: "Grok-3 Mini" },
      { value: "grok-3-mini-fast", label: "Grok-3 Mini Fast" },
      { value: "grok-2", label: "Grok-2" },
      { value: "grok-2-vision", label: "Grok-2 Vision" }
    ]
  },
  { 
    label: "DeepSeek", 
    options: [
      { value: "deepseek-chat", label: "DeepSeek Chat" },
      { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
    ]
  },
  { 
    label: "Qwen", 
    options: [
      { value: "openrouter:qwen/qwen-2.5-72b-instruct", label: "Qwen 3 Coder" },
    ]
  },
];

// Default model
export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

// Get display label for a model value
export function getModelLabel(value) {
  for (const group of MODELS) {
    const model = group.options.find(opt => opt.value === value);
    if (model) return model.label;
  }
  return value;
}

// Get provider name for a model value
export function getModelProvider(value) {
  for (const group of MODELS) {
    const model = group.options.find(opt => opt.value === value);
    if (model) return group.label;
  }
  return 'Unknown';
}

// Check if model supports vision
export function supportsVision(value) {
  // Most modern models support vision, but some explicitly don't
  const noVisionModels = [
    'deepseek-reasoner',
    'o1', 'o3', 'o3-mini', 'o4-mini' // Reasoning models typically don't support vision
  ];
  return !noVisionModels.includes(value);
}