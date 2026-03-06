import menuIcon from '../assets/menu.svg'
import reportIcon from '../assets/report.svg'
import resetIcon from '../assets/reset.svg'
import './Header.css'

type HeaderProps = {
  title: string
}

export default function Header({ title }: HeaderProps) {
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
          <p>Guest</p>
        </div>

        <div className="header-container header-login">
          <button>ログイン</button>
        </div>
      </div>
    </header>
  )
}