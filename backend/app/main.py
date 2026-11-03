import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

WEBPUSH_URL = os.getenv("WEBPUSH_URL", "http://webpush:8080")
ADMIN_KEY = os.getenv("ADMIN_KEY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("CORS_ORIGIN", "*").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PushPayload(BaseModel):
    title: str
    body: str | None = None
    icon: str | None = None
    badge: str | None = None
    tag: str | None = None
    lang: str | None = None
    silent: bool | None = None
    topic: str | None = None
    data: dict[str, Any] | None = None
    # Forces the frontend's service worker to wake up and handle the
    # notification click, instead of the default declarative-only delivery.
    legacy: bool = True


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello from the FastAPI backend"}


@app.post("/push")
async def send_push(payload: PushPayload) -> dict[str, Any]:
    if not ADMIN_KEY:
        raise HTTPException(status_code=500, detail="ADMIN_KEY is not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{WEBPUSH_URL}/notify",
            json=payload.model_dump(exclude_none=True),
            headers={"Authorization": f"Bearer {ADMIN_KEY}"},
        )

    if response.is_error:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()
