from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import CEFRLevel, Category, Quiz, QuizQuestion, Review, Vocabulary, VocabularyProgress


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = get_user_model()
        fields = ("id", "username", "email", "password")
        read_only_fields = ("id",)

    def validate(self, attrs):
        user = get_user_model()(username=attrs.get("username"), email=attrs.get("email", ""))
        try:
            password_validation.validate_password(attrs["password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return get_user_model().objects.create_user(**validated_data)


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CEFRLevel
        fields = "__all__"

    def validate_code(self, value):
        value = value.upper()
        if value not in ("A1", "A2", "B1", "B2", "C1", "C2"):
            raise serializers.ValidationError("Use a CEFR code from A1 to C2.")
        return value


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class VocabularySerializer(serializers.ModelSerializer):
    level_code = serializers.CharField(source="level.code", read_only=True)
    class Meta:
        model = Vocabulary
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class UserAdminSerializer(serializers.ModelSerializer):
    groups = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), many=True, required=False)
    class Meta:
        model = get_user_model()
        fields = ("id", "username", "email", "is_staff", "is_active", "is_superuser", "groups")
        read_only_fields = ("id", "username", "email", "is_superuser")


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.filter(content_type__app_label="vocabulary",
                                           content_type__model__in=("vocabulary", "category", "cefrlevel"),
                                           codename__regex=r"^(add|change|delete)_(vocabulary|category|cefrlevel)$"),
        many=True, required=False)

    class Meta:
        model = Group
        fields = ("id", "name", "permissions")


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = VocabularyProgress
        exclude = ("user",)
        read_only_fields = ("id", "vocabulary", "status", "due_at", "interval_days", "repetition_count")


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        exclude = ("user",)
        read_only_fields = ("id", "vocabulary", "rating", "reviewed_at", "due_at", "interval_days")


class ReviewInputSerializer(serializers.Serializer):
    vocabulary = serializers.PrimaryKeyRelatedField(queryset=Vocabulary.objects.all())
    rating = serializers.IntegerField(min_value=0, max_value=5)


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ("id", "vocabulary", "word", "options", "answer", "correct_answer")

    def to_representation(self, instance):
        result = super().to_representation(instance)
        if not instance.quiz.completed_at:
            result.pop("correct_answer")
            result.pop("answer")
        return result


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "created_at", "completed_at", "score", "questions")
        read_only_fields = fields


class QuizCreateSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=1, max_value=50, default=5)


class QuizSubmitSerializer(serializers.Serializer):
    answers = serializers.DictField(child=serializers.CharField(allow_blank=False))
