import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Quiz, QuizQuestion, Review, Vocabulary, VocabularyProgress


@transaction.atomic
def review_vocabulary(user, vocabulary, rating):
    # Lock the user even when no progress row exists yet.
    get_user_model().objects.select_for_update().get(pk=user.pk)
    progress, _ = VocabularyProgress.objects.get_or_create(user=user, vocabulary=vocabulary)
    if rating < 3:
        progress.interval_days = 1
        progress.repetition_count = 0
        progress.status = "learning"
    else:
        progress.repetition_count += 1
        progress.interval_days = (1 if progress.repetition_count == 1 else
                                  3 if progress.repetition_count == 2 else
                                  max(1, round(progress.interval_days * 2)))
        progress.status = "learning" if progress.repetition_count < 3 else "learned"
    progress.due_at = timezone.now() + timedelta(days=progress.interval_days)
    progress.save()
    Review.objects.create(user=user, vocabulary=vocabulary, rating=rating,
                          due_at=progress.due_at, interval_days=progress.interval_days)
    return progress


@transaction.atomic
def create_quiz(user, count):
    # A question needs four distinct meanings, including its correct answer.
    words = list(Vocabulary.objects.order_by("id").values("id", "word", "meaning_vi"))
    meanings = list(dict.fromkeys(w["meaning_vi"] for w in words))
    if len(meanings) < 4 or len(words) < count:
        raise ValidationError("Not enough vocabulary with distinct Vietnamese meanings.")
    quiz = Quiz.objects.create(user=user)
    for word in random.sample(words, count):
        options = random.sample([m for m in meanings if m != word["meaning_vi"]], 3)
        options.append(word["meaning_vi"])
        random.shuffle(options)
        QuizQuestion.objects.create(quiz=quiz, vocabulary_id=word["id"], word=word["word"],
                                    options=options, correct_answer=word["meaning_vi"])
    return quiz


@transaction.atomic
def submit_quiz(user, quiz_id, answers):
    quiz = Quiz.objects.select_for_update().filter(pk=quiz_id, user=user).first()
    if quiz is None:
        from rest_framework.exceptions import NotFound
        raise NotFound()
    if quiz.completed_at:
        raise ValidationError("Quiz has already been submitted.")
    questions = list(quiz.questions.all())
    if len(answers) != len(questions) or set(answers) != {str(q.pk) for q in questions}:
        raise ValidationError("Provide exactly one answer for every question.")
    for question in questions:
        answer = answers[str(question.pk)]
        if not isinstance(answer, str) or answer not in question.options:
            raise ValidationError("Each answer must be one of the question's options.")
    score = 0
    for question in questions:
        question.answer = answers[str(question.pk)]
        score += question.answer == question.correct_answer
        question.save(update_fields=["answer"])
    quiz.score = score
    quiz.completed_at = timezone.now()
    quiz.save(update_fields=["score", "completed_at"])
    return quiz
