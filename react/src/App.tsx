import Header from './components/Header'

import './App.css'
import './components/Header.css'

export default function App() {
  const handleLogin = () => {
    const domain = "https://cfn-templatebuilder-auth-prod.auth.ap-northeast-1.amazoncognito.com"
    const clientId = "3c67r2of3b5b6tjkqq4tf8m9ls"
    const redirectUri = "https://d2nn37041udeen.cloudfront.net/callback"

    const loginUrl =
    `${domain}/login?client_id=${clientId}` +
    `&response_type=code` +
    `&scope=email+openid+profile` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`

    window.location.href = loginUrl

  }
  return (
    <>
      <Header
        title="CloudFormation Builder"
        onLoginClick={handleLogin}
      />

      <main>
        <p className="note">
          テスト
        </p>
      </main>
    </>
  )
}