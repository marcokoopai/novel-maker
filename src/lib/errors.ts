export function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('email rate limit')) {
    return 'Supabase 內建郵件服務已達限額。請稍後再試，或在 Supabase Auth 配置自訂 SMTP。'
  }
  if (normalized.includes('rate limit')) {
    return '請求過於頻繁，請稍後再試。'
  }
  return message
}
