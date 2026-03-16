import { Link } from "react-router-dom"
import "./Sidebar.css"

import S3Icon from "../assets/AWS/amazon_s3.svg"
import CloudFrontIcon from "../assets/AWS/amazon_cloudfront.svg"

type SidebarProps = {
  isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <nav className="sidebar-nav">
        <Link to="/services/s3" className="sidebar-item">
          <img src={S3Icon} className="aws-icon" alt="AmazonS3" />
          <span>S3</span>
        </Link>

        <Link to="/services/cloudfront" className="sidebar-item">
          <img src={CloudFrontIcon} className="aws-icon" alt="AmazonCloudFront" />
          <span>CloudFront</span>
        </Link>

        <Link to="/services/cognito" className="sidebar-item">
          Cognito
        </Link>
      </nav>
    </aside>
  )
}