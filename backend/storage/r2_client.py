import boto3
import os
from botocore.config import Config
from dotenv import load_dotenv

# Load from root .env
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

R2_ENDPOINT = os.getenv("R2_ENDPOINT")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET = os.getenv("R2_BUCKET", "pdf-bucket")

# Cloudflare R2 requires a specific configuration for S3 compatibility
r2_config = Config(
    region_name="auto",
    retries={"max_attempts": 3, "mode": "standard"}
)

s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=r2_config
)

def upload_file(file_path: str, object_name: str):
    """Upload a file to the R2 bucket."""
    try:
        s3_client.upload_file(file_path, R2_BUCKET, object_name)
        return True, f"Successfully uploaded {object_name}"
    except Exception as e:
        return False, str(e)

def get_signed_url(object_name: str, expiration=3600):
    """Generate a signed URL for the ML microservice to download the file."""
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": R2_BUCKET, "Key": object_name},
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        return None
