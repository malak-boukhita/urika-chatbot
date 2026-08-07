import os
from pathlib import Path

import dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field

dotenv.load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

if not OPENAI_API_KEY:
    raise RuntimeError("La variable OPENAI_API_KEY n'est pas configurée.")

if not OPENAI_MODEL:
    raise RuntimeError("La variable OPENAI_MODEL n'est pas configurée.")

services_path = BASE_DIR / "services.txt"
if not services_path.exists():
    raise RuntimeError("Le fichier services.txt est introuvable.")

SERVICES_CONTEXT = services_path.read_text(encoding="utf-8")

client = OpenAI(api_key=OPENAI_API_KEY)
app = FastAPI(title="API Chatbot URIKA CLOUD", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://urikacloud.com",
        "https://www.urikacloud.com",
        "https://ais.urikacloud.com",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=800)


class ChatResponse(BaseModel):
    status: str
    answer: str


SYSTEM_INSTRUCTIONS = f"""
Tu es l'assistant virtuel officiel d'URIKA CLOUD.

Utilise uniquement les informations suivantes :

{SERVICES_CONTEXT}

Règles obligatoires :
- Réponds toujours en français.
- Réponds uniquement aux questions liées à URIKA CLOUD.
- Sois clair, professionnel et concis.
- N'invente aucun service.
- N'invente aucun prix.
- N'invente aucun délai.
- Pour une question concernant un prix, propose une demande de devis.
- Pour une question concernant un délai, explique qu'une étude du besoin est nécessaire.
- Pour une information inconnue, indique que tu ne disposes pas de cette information.
- Pour une question hors sujet, recentre poliment la conversation sur les services d'URIKA CLOUD.
- Limite la réponse à environ 150 mots.
"""


@app.get("/")
def root():
    return {"service": "Chatbot URIKA CLOUD", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "URIKA CLOUD chatbot"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    user_message = request.message.strip()

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTIONS},
                {"role": "user", "content": user_message},
            ],
        )
        answer = response.choices[0].message.content.strip()

        if not answer:
            raise ValueError("OpenAI a retourné une réponse vide.")

        return ChatResponse(status="success", answer=answer)

    except OpenAIError as error:
        print("Erreur OpenAI:", error)
        raise HTTPException(status_code=502, detail="L'assistant est temporairement indisponible.") from error

    except Exception as error:
        print("Erreur interne:", error)
        raise HTTPException(status_code=500, detail="Une erreur interne est survenue.") from error