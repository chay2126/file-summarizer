import ollama
import PyPDF2
import docx
import io


def extract_text(filename: str, content: bytes) -> str:
    """Extract plain text from .txt, .pdf, or .docx files."""
    ext = filename.lower().split(".")[-1]

    if ext == "txt":
        return content.decode("utf-8", errors="ignore")

    elif ext == "pdf":
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()

    elif ext == "docx":
        doc = docx.Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])

    else:
        raise ValueError(f"Unsupported file type: .{ext}")


def summarize(text: str, model: str = "phi3") -> dict:
    """Send text to Ollama and return a structured summary."""

    # Truncate very long documents to avoid context overflow
    max_chars = 6000
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n[Document truncated for summarization...]"

    prompt = f"""You are a professional document summarizer. Read the document below carefully and provide:

1. A SUMMARY section: Write exactly 1 clear, concise paragraph summarizing the main idea and purpose of the document.

2. A KEY POINTS section: List exactly 5 bullet points (start each with a dash "-") highlighting the most important facts, insights, or takeaways.

Format your response EXACTLY like this:
SUMMARY
<your paragraph here>

KEY POINTS
- point one
- point two
- point three
- point four
- point five

Document:
{text}
"""

    response = ollama.chat(
        model=model,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response["message"]["content"]
    return parse_response(raw)


def parse_response(raw: str) -> dict:
    """Parse the model's response into summary and bullets."""
    summary = ""
    bullets = []

    lines = raw.strip().split("\n")
    mode = None

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.upper().startswith("SUMMARY"):
            mode = "summary"
            continue
        elif line.upper().startswith("KEY POINTS"):
            mode = "bullets"
            continue

        if mode == "summary":
            summary += line + " "
        elif mode == "bullets":
            if line.startswith("-"):
                bullets.append(line[1:].strip())

    # Fallback if model didn't follow format perfectly
    if not summary and not bullets:
        summary = raw
        bullets = []

    return {
        "summary": summary.strip(),
        "bullets": bullets[:5]  # Max 5 bullets
    }
