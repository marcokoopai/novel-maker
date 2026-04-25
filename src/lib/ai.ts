import OpenAI from 'openai'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set. Create a .env file with your OpenAI API key.')
    _client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  }
  return _client
}

export async function complete(prompt: string): Promise<string> {
  const client = getClient()
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1200,
  })
  return response.choices[0]?.message?.content || ''
}
