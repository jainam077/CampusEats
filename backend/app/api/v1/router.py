"""API v1 router - combines all endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, venues, menus, dishes, reviews, photos, recommendations, admin, favorites, preferences, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(venues.router, prefix="/venues", tags=["Venues"])
api_router.include_router(menus.router, prefix="/menus", tags=["Menus"])
api_router.include_router(dishes.router, prefix="/dishes", tags=["Dishes"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(photos.router, prefix="/photos", tags=["Photos"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
api_router.include_router(preferences.router, prefix="/preferences", tags=["User Preferences"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(admin.router, tags=["Admin"])
