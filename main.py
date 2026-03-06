from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from summarizer import extract_text, summarize
import uvicorn

app = FastAPI(title="File Summarizer")

# Serve static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.post("/summarize")
async def summarize_file(file: UploadFile = File(...)):
    # Validate file type
    allowed = ["txt", "pdf", "docx"]
    ext = file.filename.lower().split(".")[-1]
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Please upload a .txt, .pdf, or .docx file."
        )

    # Read file content
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # Extract text
    try:
        text = extract_text(file.filename, content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read file: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted from the file.")

    # Summarize
    try:
        result = summarize(text, model="phi3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {str(e)}")

    return {
        "filename": file.filename,
        "word_count": len(text.split()),
        "summary": result["summary"],
        "bullets": result["bullets"]
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
