from fastapi import APIRouter

from app.api.routes import classify, projects, tags

api_router = APIRouter()
api_router.include_router(tags.router)
api_router.include_router(projects.router)
api_router.include_router(classify.router)
