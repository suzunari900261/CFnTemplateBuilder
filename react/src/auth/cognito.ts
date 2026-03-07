import { generatePkcePair } from './pkce'

const cognitoDomain = 'https://cfn-templatebuilder-auth-prod.auth.ap-northeast-1.amazoncognito.com'
const clientId = '3c67r2of3b5b6tjkqq4tf8m9ls'
const redirectUri = 'https://d2nn37041udeen.cloudfront.net/callback'
const scopes = ['openid', 'email', 'profile']

function generateState(): string {
  return crypto.randomUUID()
}

export async function redirectToLogin(): Promise<void> {
  const state = generateState()
  const { codeVerifier, codeChallenge } = await generatePkcePair()

  sessionStorage.setItem('cognito_oauth_state', state)
  sessionStorage.setItem('cognito_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  })

  window.location.assign(`${cognitoDomain}/oauth2/authorize?${params.toString()}`)
}

export async function exchangeCodeForToken(code: string): Promise<any> {
  const codeVerifier = sessionStorage.getItem('cognito_code_verifier')

  if (!codeVerifier) {
    throw new Error('code_verifier がありません。再ログインしてください。')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  })

  const response = await fetch(`${cognitoDomain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`トークン取得失敗: ${response.status} ${errorText}`)
  }

  return response.json()
}

export function validateState(returnedState: string | null): void {
  const savedState = sessionStorage.getItem('cognito_oauth_state')

  if (!savedState || savedState !== returnedState) {
    throw new Error('state 不一致です。')
  }
}

export function getStoredAccessToken(): string | null {
  return sessionStorage.getItem('access_token')
}

export function clearStoredAuth(): void {
  sessionStorage.removeItem('id_token')
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
  sessionStorage.removeItem('cognito_oauth_state')
  sessionStorage.removeItem('cognito_code_verifier')
}

export async function fetchUserInfo(accessToken: string): Promise<{
  sub: string
  email?: string
  preferred_username?: string
  username?: string
}> {
  const response = await fetch(`${cognitoDomain}/oauth2/userInfo`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`userInfo取得失敗: ${response.status} ${errorText}`)
  }

  return response.json()
}