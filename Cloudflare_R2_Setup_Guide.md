# Cloudflare R2 Bucket Setup Guide

Now that your frontend is live on Vercel and Cloudflare is managing your DNS, the next step in our architecture is creating the free R2 storage bucket to hold the PDF files.

## Step 1: Subscribe to R2 Storage (Free)

1. Log in to your Cloudflare dashboard at `dash.cloudflare.com`.
2. On the left-hand menu, scroll down and click on **"R2"**.
3. You will see a prompt to **Subscribe to R2**. Click it.
4. **Important**: Cloudflare requires you to add a credit card or PayPal account to your billing profile just to prevent spam bots. **They will not charge you anything.** Remember you get 10GB free every month, and we will not exceed that. 
5. Complete the billing setup and return to the R2 page.

## Step 2: Create the Bucket

1. Once subscribed, click the blue **"Create bucket"** button.
2. Enter the Bucket name: `pdf-bucket` *(It must be lowercase with hyphens, no spaces)*.
3. For Location Hint, leave it as `Automatic`.
4. Click **"Create bucket"**.
5. You are now inside your empty warehouse! 

## Step 3: Get your Access Keys for the Backend

Our Python FastAPI backend will need the "keys to the warehouse" so it can safely upload the PDFs.

1. Go back to the main **R2 dashboard** (click "R2" in the left-hand menu again).
2. Look on the right side of the screen and click on **"Manage R2 API Tokens"**.
3. Click **"Create API token"**.
4. Set the following permissions:
   * **Token name:** `PDF Summarizer Backend`
   * **Permissions:** Select **"Object Read & Write"** *(Crucial! Otherwise, the backend can't upload!)*
   * **Specify bucket(s):** Select "Specific buckets" and choose the `pdf-bucket` you just created.
5. Click **"Create API Token"** at the bottom.

## Step 4: Save your Secrets!

Cloudflare will now show you a screen with several secret keys. **This is the ONLY time you will ever see them!**

Copy the following three values and save them somewhere safe (like a notepad file):
1. **Access Key ID**
2. **Secret Access Key**
3. **Endpoint URL** (It looks like `https://<Account-ID>.r2.cloudflarestorage.com`)

Once you have saved those three values to a notepad file, let me know, and we can start writing the actual Python backend code!
