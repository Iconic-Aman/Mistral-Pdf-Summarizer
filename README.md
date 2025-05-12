
# PDF Summarization using Fine-Tuned Mistral-7B (Unsloth)

This project summarizes lengthy PDF documents using a fine-tuned [Mistral-7B](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3) model with Unsloth for efficient inference on long inputs.

## 🔍 Features

- Summarizes entire PDFs (even 300-400 pages) by chunking and compressing text.
- Uses Unsloth's optimized model loading for faster generation on 4-bit quantized models.
- Handles large documents by breaking text into manageable chunks.
- Final summary is refined using a second-pass summarization.
- User-friendly Gradio interface for interaction.

## 📁 Project Structure

## 🧠 Model Used

- **Model ID:** `aman012/mistral-7b-instruct-v0.3-bnb-4bit-200`
- **Framework:** Unsloth + HuggingFace Transformers
- **Token Limit during Inference:** 2048 tokens (input must be chunked if larger)

## 🚀 How It Works

1. Upload a PDF.
2. Text is extracted and split into ~1500 token chunks.
3. Each chunk is summarized.
4. All summaries are joined and re-summarized for a concise output.

## ⚙️ Requirements

Install dependencies:

```bash
pip install -r requirements.txt
```

## 🖥️ Gradio Web App

```
gradio main.py
```

⚠️ Note: This Sace uses a lightweight model due to Hugging Face’s CPU limitations. The actual fine-tuned 4-bit LLM model is available [here](https://huggingface.co/aman012/mistral-7b-instruct-v0.3-bnb-4bit-200), and runs best in GPU environments like Colab or locally with a compatible GPU setup.

## 🙋‍♂️ Author

* **Aman Kumar Srivastava**

## 📜 License

MIT License
