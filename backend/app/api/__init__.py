from fastapi import APIRouter

from app.api.routes import classify, images, tags

api_router = APIRouter()
api_router.include_router(images.router)
api_router.include_router(tags.router)
api_router.include_router(classify.router)
