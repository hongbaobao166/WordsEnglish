from django.conf import settings
from django.db import models


class CEFRLevel(models.Model):
    code = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=100)
    sort_order = models.PositiveSmallIntegerField()


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)


class Vocabulary(models.Model):
    word = models.CharField(max_length=200, db_index=True)
    meaning_en = models.TextField()
    meaning_vi = models.TextField()
    phonetic = models.CharField(max_length=200, blank=True)
    audio_url = models.URLField(blank=True)
    example_sentence = models.TextField(blank=True)
    level = models.ForeignKey(CEFRLevel, on_delete=models.PROTECT)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class VocabularyProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.PROTECT)
    status = models.CharField(max_length=10, default="new")
    due_at = models.DateTimeField(null=True, blank=True)
    interval_days = models.PositiveIntegerField(default=0)
    repetition_count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "vocabulary"], name="unique_user_vocabulary")
        ]


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.PROTECT)
    rating = models.PositiveSmallIntegerField()
    reviewed_at = models.DateTimeField(auto_now_add=True)
    due_at = models.DateTimeField()
    interval_days = models.PositiveIntegerField()


class Quiz(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveIntegerField(null=True, blank=True)


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.PROTECT)
    word = models.CharField(max_length=200)
    options = models.JSONField()
    correct_answer = models.TextField()
    answer = models.TextField(null=True, blank=True)
