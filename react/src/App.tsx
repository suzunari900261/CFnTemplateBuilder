import Header from './components/Header'
import { redirectToLogin } from './auth/cognito'

import './App.css'
import './components/Header.css'

export default function App() {
  const handleLogin = async () => {
    await redirectToLogin()
  }

  return (
    <>
      <Header
        title="CloudFormation Builder"
        onLoginClick={handleLogin}
      />

      <main>
        <p className="note">テスト01</p>
      </main>
    </>
  )
}