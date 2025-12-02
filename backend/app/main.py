# main.py
from fastapi import FastAPI

from . import database, models
from .auth import router as auth_router


def create_app() -> FastAPI:
    app = FastAPI(title="OMAJ-14 Backend", version="0.1.0")

    @app.on_event("startup")
    def on_startup() -> None:
        models.Base.metadata.create_all(bind=database.engine)

    app.include_router(auth_router)

    @app.get("/")
    def root():
        return {"message": "Backend is running!"}

    return app


app = create_app()
