import { Link } from "react-router-dom"
import "./Sidebar.css"

import S3Icon from "../assets/AWS/amazon_s3.svg"

type SidebarProps = {
  isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <nav className="sidebar-nav">
        <Link to="/services/s3" className="sidebar-item">
          <img src={S3Icon} className="s3-icon" alt="AmazonS3" />
          <span>Amazon S3</span>
        </Link>

        <Link to="/services/cloudfront" className="sidebar-item">
          CloudFront
        </Link>

        <Link to="/services/cognito" className="sidebar-item">
          Cognito
        </Link>
      </nav>
    </aside>
  )
}