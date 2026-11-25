from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from rest_framework.test import APIClient

from .models import CEFRLevel, Category, Review, Vocabulary, VocabularyProgress


class APITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="learner", password="A-long-passphrase-123")
        self.other = get_user_model().objects.create_user(username="other", password="A-long-passphrase-456")
        self.staff = get_user_model().objects.create_user(username="staff", password="A-long-passphrase-789", is_staff=True)
        self.staff.user_permissions.set(Permission.objects.filter(content_type__app_label="vocabulary",
                                                                 content_type__model__in=["vocabulary", "category", "cefrlevel"]))
        self.level = CEFRLevel.objects.create(code="A1", name="Beginner", sort_order=1)
        self.category = Category.objects.create(name="Basics", slug="basics")
        self.words = [Vocabulary.objects.create(word=f"word{i}", meaning_en=f"meaning{i}",
                      meaning_vi=f"nghia{i}", level=self.level, category=self.category) for i in range(5)]

    def auth(self, user=None):
        self.client.force_authenticate(user=user or self.user)

    def test_registration_login_refresh_logout(self):
        response = self.client.post("/api/auth/register/", {"username": "newuser", "password": "Strong-Phrase-9876",
                                                            "is_staff": True}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertFalse(get_user_model().objects.get(username="newuser").is_staff)
        self.assertEqual(self.client.post("/api/auth/register/", {"username": "weak", "password": "123"}).status_code, 400)
        tokens = self.client.post("/api/auth/login/", {"username": "newuser", "password": "Strong-Phrase-9876"}).data
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + tokens["access"])
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)
        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": tokens["refresh"]}).status_code, 204)
        self.assertEqual(self.client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]}).status_code, 401)

    def test_catalog_authorization_search_and_protection(self):
        self.assertEqual(self.client.get("/api/vocabulary/").status_code, 401)
        self.auth()
        payload = {"word": "new", "meaning_en": "new", "meaning_vi": "moi",
                   "level": self.level.id, "category": self.category.id}
        self.assertEqual(self.client.post("/api/vocabulary/", payload).status_code, 403)
        result = self.client.get("/api/vocabulary/", {"search": "word1", "level": "A1", "category": "basics"})
        self.assertEqual(result.data["count"], 1)
        self.auth(self.staff)
        created = self.client.post("/api/vocabulary/", payload)
        self.assertEqual(created.status_code, 201)
        pk = created.data["id"]
        self.assertEqual(self.client.patch(f"/api/vocabulary/{pk}/", {"word": "changed"}).status_code, 200)
        self.assertEqual(self.client.delete(f"/api/vocabulary/{pk}/").status_code, 204)
        self.assertEqual(self.client.delete(f"/api/levels/{self.level.id}/").status_code, 409)

    def test_review_scheduling_and_isolation(self):
        self.auth()
        self.assertEqual(self.client.post("/api/reviews/", {"vocabulary": self.words[0].id, "rating": 6}).status_code, 400)
        response = self.client.post("/api/reviews/", {"vocabulary": self.words[0].id, "rating": 4})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["interval_days"], 1)
        self.assertEqual(self.client.post("/api/reviews/", {"vocabulary": self.words[0].id, "rating": 4}).data["interval_days"], 3)
        self.assertEqual(self.client.post("/api/reviews/", {"vocabulary": self.words[0].id, "rating": 1}).data["repetition_count"], 0)
        self.assertEqual(Review.objects.count(), 3)
        self.assertEqual(self.client.get("/api/flashcards/").data["count"], 4)
        self.auth(self.other)
        self.assertEqual(self.client.get("/api/progress/").data["count"], 0)
        self.assertEqual(self.client.get("/api/reviews/").data["count"], 0)
        self.assertEqual(self.client.get(f"/api/progress/{VocabularyProgress.objects.first().pk}/").status_code, 404)

    def test_bulk_create_is_staff_only_validated_and_atomic(self):
        word = {"word": "apple", "meaning_en": "fruit", "meaning_vi": "táo",
                "level": self.level.id, "category": self.category.id}
        payload = [word, {**word, "word": "book", "meaning_vi": "sách"}]
        self.assertEqual(self.client.post("/api/vocabulary/bulk/", payload, format="json").status_code, 401)
        self.auth()
        self.assertEqual(self.client.post("/api/vocabulary/bulk/", payload, format="json").status_code, 403)
        self.auth(self.staff)
        invalid = [word, {**word, "meaning_vi": ""}]
        self.assertEqual(self.client.post("/api/vocabulary/bulk/", invalid, format="json").status_code, 400)
        self.assertEqual(Vocabulary.objects.count(), 5)
        self.assertEqual(self.client.post("/api/vocabulary/bulk/", [], format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/vocabulary/bulk/", [word] * 101, format="json").status_code, 400)
        response = self.client.post("/api/vocabulary/bulk/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(Vocabulary.objects.count(), 7)

    def test_flashcards_include_null_due_and_ignore_other_users_progress(self):
        VocabularyProgress.objects.create(user=self.user, vocabulary=self.words[0], due_at=None)
        VocabularyProgress.objects.create(user=self.other, vocabulary=self.words[1], due_at=None)
        self.auth()
        response = self.client.get("/api/flashcards/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual({item["id"] for item in response.data["results"]},
                         {word.id for word in self.words})

    def test_dashboard_and_admin_user_permissions(self):
        self.auth()
        self.assertEqual(self.client.get("/api/dashboard/").data["due"], 5)
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)
        self.auth(self.staff)
        self.assertEqual(self.client.get("/api/admin/dashboard/").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)
        self.assertEqual(self.client.patch(f"/api/admin/users/{self.user.id}/", {"is_staff": True}).status_code, 403)
        superuser = get_user_model().objects.create_superuser(username="root", password="A-long-root-passphrase-987")
        self.auth(superuser)
        self.assertEqual(self.client.patch(f"/api/admin/users/{self.user.id}/", {"is_staff": True}).status_code, 200)
        self.assertEqual(self.client.patch(f"/api/admin/users/{superuser.id}/", {"is_active": False}).status_code, 403)

    def test_role_management_and_resource_action_enforcement(self):
        root = get_user_model().objects.create_superuser(username="admin", password="Strong-Phrase-987")
        self.auth(self.user)
        self.assertEqual(self.client.get("/api/admin/roles/").status_code, 403)
        self.auth(self.staff)
        self.assertEqual(self.client.get("/api/admin/roles/").status_code, 403)
        self.auth(root)
        permission = Permission.objects.get(content_type__app_label="vocabulary", codename="add_vocabulary")
        forbidden = Permission.objects.get(content_type__app_label="auth", codename="change_user")
        self.assertEqual(self.client.post("/api/admin/roles/", {"name": "bad", "permissions": [forbidden.id]}, format="json").status_code, 400)
        role = self.client.post("/api/admin/roles/", {"name": "editor", "permissions": [permission.id]}, format="json")
        self.assertEqual(role.status_code, 201)
        self.assertEqual(self.client.patch(f"/api/admin/users/{self.user.id}/", {"groups": [role.data["id"]]}, format="json").status_code, 200)
        self.user.refresh_from_db()
        self.auth(self.user)
        payload = {"word": "hello", "meaning_en": "greeting", "meaning_vi": "xin chào",
                   "level": self.level.id, "category": self.category.id}
        created = self.client.post("/api/vocabulary/", payload, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(self.client.patch(f"/api/vocabulary/{created.data['id']}/", {"word": "changed"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/vocabulary/{created.data['id']}/").status_code, 403)
        self.assertEqual(self.client.post("/api/categories/", {"name": "x", "slug": "x"}, format="json").status_code, 403)
        self.auth(root)
        self.assertEqual(self.client.patch(f"/api/admin/users/{root.id}/", {"groups": []}, format="json").status_code, 403)

    def test_quiz_isolation_and_grading(self):
        self.auth()
        created = self.client.post("/api/quizzes/", {"count": 2}, format="json")
        self.assertEqual(created.status_code, 201)
        quiz_id = created.data["id"]
        self.assertNotIn("correct_answer", created.data["questions"][0])
        self.auth(self.other)
        self.assertEqual(self.client.get(f"/api/quizzes/{quiz_id}/").status_code, 404)
        self.auth()
        self.assertEqual(self.client.post(f"/api/quizzes/{quiz_id}/submit/", {"answers": {}}, format="json").status_code, 400)
        answers = {str(q["id"]): q["options"][0] for q in created.data["questions"]}
        result = self.client.post(f"/api/quizzes/{quiz_id}/submit/", {"answers": answers}, format="json")
        self.assertEqual(result.status_code, 200)
        self.assertIn("correct_answer", result.data["questions"][0])
        self.assertEqual(self.client.post(f"/api/quizzes/{quiz_id}/submit/", {"answers": answers}, format="json").status_code, 400)
