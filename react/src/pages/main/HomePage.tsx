import { Link } from "react-router-dom"
import S3Icon from "../../assets/AWS/amazon_s3.svg"

export default function HomePage() {
  return (
      <main>
        <div className="aws-service-container-line">
          <Link to="/services/s3" className="aws-service-container">
            <img src={S3Icon} className="s3-icon" alt="AmazonS3" />
            <h3>Amazon S3</h3>
          </Link>

          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>

          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>

          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>

          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>
        </div>

        <div className="aws-service-container-line">
          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>

          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>

          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>

          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>

          <div className="aws-service-container container-disabled">
            <h3>Coming Soon</h3>
          </div>
        </div>
      </main>
  )
}