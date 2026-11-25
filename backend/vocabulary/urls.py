from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register("levels", views.LevelViewSet)
router.register("categories", views.CategoryViewSet)
router.register("vocabulary", views.VocabularyViewSet, basename="vocabulary")
router.register("progress", views.ProgressViewSet, basename="progress")
router.register("reviews", views.ReviewViewSet, basename="review")
router.register("quizzes", views.QuizViewSet, basename="quiz")
router.register("admin/users", views.UserAdminViewSet, basename="admin-users")
router.register("admin/roles", views.RoleViewSet, basename="admin-roles")

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/logout/", views.logout),
    path("auth/me/", views.me),
    path("flashcards/", views.flashcards),
    path("dashboard/", views.dashboard),
    path("admin/dashboard/", views.admin_dashboard),
    path("admin/permissions/", views.role_permissions),
    path("", include(router.urls)),
]
