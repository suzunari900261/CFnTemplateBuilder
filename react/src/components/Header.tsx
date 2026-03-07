import menuIcon from '../assets/menu.svg'
import reportIcon from '../assets/report.svg'
import resetIcon from '../assets/reset.svg'
import './Header.css'

type HeaderProps = {
  title: string
  username: string
  isAuthenticated: boolean
  onLoginClick: () => void
  onLogoutClick: () => void
}

export default function Header({
  title,
  username,
  isAuthenticated,
  onLoginClick,
  onLogoutClick,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-components">
        <div className="header-container header-menu">
          <img src={menuIcon} className="menu-icon" alt="menu" />
        </div>

        <div className="header-container header-title">
          <h1>{title}</h1>
        </div>

        <div className="header-container header-actions">
          <img src={reportIcon} className="report-icon" alt="report" />
          <img src={resetIcon} className="reset-icon" alt="reset" />
        </div>

        <div className="header-container header-loginstatus">
          <p>{username}</p>
        </div>

        <div className="header-container header-login">
          {isAuthenticated ? (
            <button onClick={onLogoutClick}>ログアウト</button>
          ) : (
            <button onClick={onLoginClick}>ログイン</button>
          )}
        </div>
      </div>
    </header>
  )
}