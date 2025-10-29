# Backend Service

FastAPI service that exposes authentication endpoints for the OMAJ-14 project.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r app/requirements.txt
```

Optionally create a `.env` file in `backend/` to override defaults such as `SECRET_KEY`, `DATABASE_URL`, and `ACCESS_TOKEN_EXPIRE_MINUTES`.

## Running

```bash
uvicorn app.main:app --reload
```

The OpenAPI docs are available at `http://127.0.0.1:8000/docs`.

## Auth Endpoints

- `POST /auth/register` – register a user (email, password, optional name/preferences)
- `POST /auth/token` – obtain an access token (OAuth2 password flow)
- `GET /auth/me` – fetch the current authenticated user using the bearer token
