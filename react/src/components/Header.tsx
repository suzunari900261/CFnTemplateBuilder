import { Link } from "react-router-dom"

import menuIcon from '../assets/menu.svg'
import reportIcon from '../assets/report.svg'
import resetIcon from '../assets/reset.svg'
import DownloadIcon from '../assets/download.svg'
import './Header.css'

type HeaderProps = {
  title: string
  username: string
  isAuthenticated: boolean
  onLoginClick: () => void
  onLogoutClick: () => void
  onToggleSidebar: () => void
}

export default function Header({
  title,
  username,
  isAuthenticated,
  onLoginClick,
  onLogoutClick,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-components">
        <div className="header-container header-menu">
          <img
            src={menuIcon}
            className="menu-icon"
            alt="menu"
            onClick={onToggleSidebar}
          />
        </div>

        <div className="header-container header-title">
          <Link to="/">
            <h1>{title}</h1>
          </Link>
        </div>

        <div className="header-container header-actions">
          <img src={resetIcon} className="reset-icon" alt="reset" />
          <img src={reportIcon} className="report-icon" alt="report" />
          <img src={DownloadIcon} className="download-icon" alt="download" />
        </div>

        <div className="header-container header-loginstatus">
          <div className="header-loginstatus-top">ユーザー名</div>
          <div className="header-loginstatus-bottom">
            <p>{username}</p>
          </div>
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