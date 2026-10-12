// Переводим частые ошибки Supabase на русский
const known: [RegExp, string][] = [
  [/invalid login credentials/i, 'Неверная почта или пароль'],
  [/already registered|already been registered/i, 'Эта почта уже зарегистрирована. Попробуйте войти'],
  [/password should be at least/i, 'Пароль должен быть не короче 6 символов'],
  [/unable to validate email|invalid format|email address .* is invalid/i, 'Проверьте адрес почты'],
  [/email not confirmed/i, 'Почта не подтверждена. Выключите подтверждение почты в Supabase'],
  [/(signups?|logins?|provider) .*(not allowed|disabled)/i, 'Вход по почте выключен в Supabase: Authentication → Sign In / Providers → Email → включите «Enable Email provider»'],
  [/error sending .*email/i, 'Supabase пытается отправить письмо. Выключите «Confirm email» в настройках Supabase'],
  [/password should contain|weak password/i, 'Пароль слишком простой. Добавьте цифры и буквы'],
  [/rate limit|too many requests/i, 'Слишком много попыток. Подождите минуту'],
  [/failed to fetch|network/i, 'Нет связи с сервером. Проверьте интернет'],
]

export function ruError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error)
  for (const [re, text] of known) if (re.test(message)) return text
  // наши собственные ошибки из базы уже на русском
  if (/[а-яё]/i.test(message)) return message
  // неизвестная ошибка — показываем и оригинальный текст, чтобы было понятно, в чём дело
  return `Что-то пошло не так. Попробуйте ещё раз (${message})`
}
