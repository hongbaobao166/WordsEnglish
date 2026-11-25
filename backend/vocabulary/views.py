from django.db.models import Q
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from . import serializers, services
from .models import CEFRLevel, Category, Quiz, Review, Vocabulary, VocabularyProgress


class StaffWritePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        action_name = {"POST": "add", "PUT": "change", "PATCH": "change", "DELETE": "delete"}.get(request.method)
        model = view.get_serializer_class().Meta.model
        return bool(action_name and user.has_perm(f"{model._meta.app_label}.{action_name}_{model._meta.model_name}"))


class CatalogViewSet(viewsets.ModelViewSet):
    permission_classes = (StaffWritePermission,)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({"detail": "This record is referenced and cannot be deleted."},
                            status=status.HTTP_409_CONFLICT)


class LevelViewSet(CatalogViewSet):
    queryset = CEFRLevel.objects.order_by("sort_order", "id")
    serializer_class = serializers.LevelSerializer


class CategoryViewSet(CatalogViewSet):
    queryset = Category.objects.order_by("name", "id")
    serializer_class = serializers.CategorySerializer
    filter_backends = (filters.SearchFilter,)
    search_fields = ("name", "slug")


class VocabularyViewSet(CatalogViewSet):
    serializer_class = serializers.VocabularySerializer
    filter_backends = (filters.SearchFilter,)
    search_fields = ("word", "meaning_en", "meaning_vi")

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        serializer = self.get_serializer(data=request.data, many=True, allow_empty=False, max_length=100)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        queryset = Vocabulary.objects.select_related("level", "category").order_by("id")
        level = self.request.query_params.get("level")
        category = self.request.query_params.get("category")
        if level:
            queryset = queryset.filter(level__code__iexact=level)
        if category:
            queryset = queryset.filter(category_id=category) if category.isdigit() else queryset.filter(category__slug=category)
        return queryset


class RegisterView(generics.CreateAPIView):
    serializer_class = serializers.RegistrationSerializer
    permission_classes = (permissions.AllowAny,)


@api_view(["POST"])
def logout(request):
    try:
        token = RefreshToken(request.data.get("refresh", ""))
        if str(token.get("user_id")) != str(request.user.pk):
            raise TokenError("Invalid token")
        token.blacklist()
    except (TokenError, TypeError):
        raise ValidationError({"refresh": "Invalid or expired refresh token."})
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def me(request):
    return Response({"id": request.user.pk, "username": request.user.username,
                     "email": request.user.email, "is_staff": request.user.is_staff,
                     "is_superuser": request.user.is_superuser,
                     "permissions": sorted(request.user.get_all_permissions())})


class ProgressViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.ProgressSerializer

    def get_queryset(self):
        return VocabularyProgress.objects.filter(user=self.request.user).order_by("id")


class ReviewViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).order_by("-reviewed_at", "-id")

    def create(self, request):
        serializer = serializers.ReviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        progress = services.review_vocabulary(request.user, **serializer.validated_data)
        return Response(serializers.ProgressSerializer(progress).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def flashcards(request):
    # Include unstarted words and words currently due, not other users' progress.
    due_ids = VocabularyProgress.objects.filter(
        Q(due_at__isnull=True) | Q(due_at__lte=timezone.now()), user=request.user
    ).values("vocabulary_id")
    started_ids = VocabularyProgress.objects.filter(user=request.user).values("vocabulary_id")
    queryset = Vocabulary.objects.filter(Q(id__in=due_ids) | ~Q(id__in=started_ids)).order_by("id")
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(queryset, request)
    return paginator.get_paginated_response(serializers.VocabularySerializer(page, many=True).data)


@api_view(["GET"])
def dashboard(request):
    progress = VocabularyProgress.objects.filter(user=request.user)
    started = progress.values("vocabulary_id")
    due = progress.filter(Q(due_at__isnull=True) | Q(due_at__lte=timezone.now())).values("vocabulary_id")
    return Response({
        "total": Vocabulary.objects.count(),
        "due": Vocabulary.objects.filter(Q(id__in=due) | ~Q(id__in=started)).count(),
        "learning": progress.filter(status="learning").count(),
        "mastered": progress.filter(status="learned").count(),
    })


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_dashboard(request):
    return Response({"users": get_user_model().objects.count(), "vocabulary": Vocabulary.objects.count(),
                     "categories": Category.objects.count(), "reviews": Review.objects.count()})


class SuperuserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class UserAdminViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = get_user_model().objects.order_by("id")
    serializer_class = serializers.UserAdminSerializer
    permission_classes = (SuperuserPermission,)

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        if not request.user.is_superuser:
            return Response({"detail": "Only superusers can change account access."}, status=403)
        if user.is_superuser or user == request.user:
            return Response({"detail": "Cannot change superuser or your own access."}, status=403)
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            user = serializer.save()
            if "groups" in request.data and "is_staff" not in request.data:
                user.is_staff = user.groups.exists()
                user.save(update_fields=["is_staff"])
        return Response(serializer.data)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related("permissions").order_by("name", "id")
    serializer_class = serializers.RoleSerializer
    permission_classes = (SuperuserPermission,)


@api_view(["GET"])
@permission_classes([SuperuserPermission])
def role_permissions(request):
    allowed = Permission.objects.filter(content_type__app_label="vocabulary",
                                        content_type__model__in=("vocabulary", "category", "cefrlevel"),
                                        codename__regex=r"^(add|change|delete)_(vocabulary|category|cefrlevel)$")
    return Response(list(allowed.order_by("content_type__model", "codename").values(
        "id", "codename", "content_type__model")))


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.QuizSerializer

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user).prefetch_related("questions").order_by("-id")

    def create(self, request):
        serializer = serializers.QuizCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = services.create_quiz(request.user, **serializer.validated_data)
        return Response(self.get_serializer(quiz).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        get_object_or_404(self.get_queryset(), pk=pk)
        serializer = serializers.QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = services.submit_quiz(request.user, pk, serializer.validated_data["answers"])
        return Response(self.get_serializer(quiz).data)
