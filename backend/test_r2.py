import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.storage.r2_client import s3_client, R2_BUCKET

def test_r2_connection():
    try:
        print(f"Testing connection to Cloudflare R2 (Bucket: {R2_BUCKET})...")
        response = s3_client.list_objects_v2(Bucket=R2_BUCKET, MaxKeys=1)
        print(f"Successfully connected to R2 bucket '{R2_BUCKET}'!")
    except Exception as e:
        print(f"Failed to connect to R2: {e}")

if __name__ == "__main__":
    test_r2_connection()
