from django.core.management.base import BaseCommand
from django.db import transaction

from vocabulary.models import Category, CEFRLevel, Vocabulary


class Command(BaseCommand):
    help = "Add a small synthetic vocabulary sample without changing existing entries."

    @transaction.atomic
    def handle(self, *args, **options):
        levels = {}
        for index, code in enumerate(("A1", "A2", "B1", "B2", "C1", "C2"), 1):
            levels[code], _ = CEFRLevel.objects.get_or_create(
                code=code, defaults={"name": code, "sort_order": index}
            )
        category, _ = Category.objects.get_or_create(
            slug="learnenglish-seed-everyday",
            defaults={"name": "Everyday (sample)", "description": "Synthetic sample vocabulary."},
        )
        for word, en, vi in (
            ("book", "A set of written pages.", "quyển sách"),
            ("hello", "A greeting.", "xin chào"),
        ):
            Vocabulary.objects.get_or_create(
                word=word, category=category, level=levels["A1"],
                defaults={"meaning_en": en, "meaning_vi": vi},
            )
        self.stdout.write("Sample vocabulary seed complete.")
