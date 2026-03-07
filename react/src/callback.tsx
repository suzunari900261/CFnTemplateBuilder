import { useEffect, useState } from 'react'
import { exchangeCodeForToken, validateState } from './auth/cognito'

export default function Callback() {
  const [message, setMessage] = useState('ログイン処理中...')

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const error = url.searchParams.get('error')

        if (error) {
          throw new Error(`Cognito error: ${error}`)
        }

        if (!code) {
          throw new Error('認可コードがありません。')
        }

        validateState(state)

        const tokenResponse = await exchangeCodeForToken(code)

        sessionStorage.setItem('id_token', tokenResponse.id_token)
        sessionStorage.setItem('access_token', tokenResponse.access_token)

        if (tokenResponse.refresh_token) {
          sessionStorage.setItem('refresh_token', tokenResponse.refresh_token)
        }

        setMessage('ログイン成功')
        window.location.replace('/')
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'ログインに失敗しました')
      }
    }

    void run()
  }, [])

  return <p>{message}</p>
}