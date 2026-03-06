# File Summarizer 📄

A local AI-powered file summarizer built with FastAPI + Ollama (phi3 model).

## Features
- Supports .txt, .pdf, .docx files
- Generates a summary paragraph + 5 key bullet points
- Runs 100% locally — no data leaves your machine

## Requirements
- Python 3.10+
- [Ollama](https://ollama.com) with `phi3` model pulled

## Setup
```bash
pip install fastapi uvicorn python-multipart PyPDF2 python-docx ollama
ollama pull phi3
python3 main.py
```
Then open http://localhost:8000
