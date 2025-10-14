from fastapi import FastAPI
from app.routers import health, auth

app = FastAPI(
    title="Campus Eats API",
    version="0.1.0",
    description="Backend for OMAJ-14 Campus Eats"
)

# Routers
app.include_router(health.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"status": "ok", "service": "campus-eats", "docs": "/docs"}
