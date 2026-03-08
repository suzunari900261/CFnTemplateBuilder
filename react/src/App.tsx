import { useEffect, useState } from 'react'
import Header from './components/Header'
import {
  redirectToLogin,
  getStoredAccessToken,
  fetchUserInfo,
  clearStoredAuth,
  logout,
  subscribeAuthState,
} from './auth/cognito'

import './App.css'
import './components/Header.css'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('Guest')
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        setIsAuthenticated(false)
        setUsername('Guest')
        setIsAuthLoading(false)
        return
      }

      try {
        const userInfo = await fetchUserInfo(accessToken)
        const displayName =
          userInfo.preferred_username ||
          userInfo.email ||
          userInfo.username ||
          'Authenticated User'

        setIsAuthenticated(true)
        setUsername(displayName)
      } catch (error) {
        console.error(error)
        clearStoredAuth()
        setIsAuthenticated(false)
        setUsername('Guest')
      } finally {
        setIsAuthLoading(false)
      }
    }

    void initializeAuth()

    const unsubscribe = subscribeAuthState(() => {
      setIsAuthLoading(true)
      void initializeAuth()
    })

    return unsubscribe
  }, [])

  const handleLogin = async () => {
    await redirectToLogin()
  }

  const handleLogout = () => {
    logout()
    alert('ログアウトが完了しました')
  }

  return (
    <>
      <Header
        title="CloudFormation Builder"
        username={isAuthLoading ? '確認中...' : username}
        isAuthenticated={isAuthenticated}
        onLoginClick={handleLogin}
        onLogoutClick={handleLogout}
      />

      <main>
        <p className="note">テスト03</p>
      </main>
    </>
  )
}