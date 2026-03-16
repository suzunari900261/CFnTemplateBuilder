import { Link } from "react-router-dom"
import S3Icon from "../../assets/AWS/amazon_s3.svg"
import CloudFrontIcon from "../../assets/AWS/amazon_cloudfront.svg"

type HomePageProps = {
  isAuthenticated: boolean
}

export default function HomePage({
  isAuthenticated,
}: HomePageProps) {
  const guestMessage = "Guestユーザーでは使用できません"

  return (
    <main>
      <div className="aws-service-container-line">
        <Link to="/services/s3" className="aws-service-container">
          <img src={S3Icon} className="aws-service-icon" alt="AmazonS3" />
          <h3>S3</h3>
        </Link>

        {isAuthenticated ? (
          <Link to="/services/cloudfront" className="aws-service-container">
            <img
              src={CloudFrontIcon}
              className="aws-service-icon"
              alt="AmazonCloudFront"
            />
            <h3>CloudFront</h3>
          </Link>
        ) : (
          <div
            className="aws-service-container container-disabled guest-disabled"
            title={guestMessage}
          >
            <img
              src={CloudFrontIcon}
              className="aws-service-icon"
              alt="AmazonCloudFront"
            />
            <h3>CloudFront</h3>
          </div>
        )}

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