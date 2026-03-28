import { useEffect, useState } from 'react'
import { Routes, Route } from "react-router-dom"
import './App.css'
import './pages/services/AWS-Services-Page.css'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import HomePage from "./pages/main/HomePage"
import S3Page from "./pages/services/S3Page"
import CloudFrontPage from "./pages/services/CloudFrontPage"

import {
  redirectToLogin,
  getStoredAccessToken,
  fetchUserInfo,
  clearStoredAuth,
  logout,
  subscribeAuthState,
} from './auth/cognito'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('Guest')
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
          userInfo.username ||
          userInfo.email ||
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

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  return (
    <>
      <Header
        title="CloudFormation Builder"
        username={isAuthLoading ? '確認中...' : username}
        isAuthenticated={isAuthenticated}
        onLoginClick={handleLogin}
        onLogoutClick={handleLogout}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="app-layout">
        <Sidebar isOpen={isSidebarOpen} />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} />} />
            <Route path="/services/s3" element={<S3Page />} />
            <Route
              path="/services/cloudfront"
              element={<CloudFrontPage isAuthenticated={isAuthenticated} />}
            />
          </Routes>
        </main>
      </div>
    </>
  )
}