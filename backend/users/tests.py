import shutil
import tempfile
from io import BytesIO

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
	Application,
	CompanyProfile,
	Opportunity,
	PortfolioProject,
	Skill,
	StudentProfile,
	User,
)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class StudentProfileTests(APITestCase):
	def setUp(self):
		self.student_user = User.objects.create_user(
			username="profile-student",
			password="ProfilePass123!",
			email="profile@example.com",
			role=User.Role.STUDENT,
		)
		self.student = StudentProfile.objects.create(user=self.student_user)
		self.company_user = User.objects.create_user(
			username="profile-company",
			password="ProfilePass123!",
			role=User.Role.COMPANY,
		)
		self.admin_user = User.objects.create_user(
			username="profile-admin",
			password="ProfilePass123!",
			role=User.Role.ADMIN,
			is_staff=True,
		)
		self.authenticate_as(self.student_user)

	def tearDown(self):
		shutil.rmtree(settings.MEDIA_ROOT, ignore_errors=True)

	def authenticate_as(self, user):
		token = RefreshToken.for_user(user).access_token
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def test_existing_student_profile_remains_compatible(self):
		response = self.client.get("/api/student/profile/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["profile_photo"], None)
		self.assertEqual(response.data["experience"], "")
		self.assertEqual(response.data["skills"], [])

	def test_student_can_update_experience_and_skills_with_json(self):
		response = self.client.put(
			"/api/student/profile/",
			{
				"experience": "Two years building Django APIs.",
				"skills": ["Django", "Python"],
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["experience"], "Two years building Django APIs.")
		self.assertEqual(response.data["skills"], ["Django", "Python"])
		self.student.refresh_from_db()
		self.assertEqual(
			set(self.student.skills.values_list("name", flat=True)),
			{"Django", "Python"},
		)

	def test_student_can_upload_valid_profile_photo(self):
		image_buffer = BytesIO()
		Image.new("RGB", (2, 2), color="blue").save(image_buffer, format="PNG")
		upload = SimpleUploadedFile(
			"profile.png",
			image_buffer.getvalue(),
			content_type="image/png",
		)

		response = self.client.put(
			"/api/student/profile/",
			{"profile_photo": upload},
			format="multipart",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data["profile_photo"].startswith("http"))
		self.assertIn("/media/profile_photos/", response.data["profile_photo"])
		self.student.refresh_from_db()
		self.assertTrue(self.student.profile_photo.name.endswith(".png"))

	def test_invalid_profile_photo_is_rejected(self):
		upload = SimpleUploadedFile(
			"profile.txt",
			b"not an image",
			content_type="text/plain",
		)

		response = self.client.put(
			"/api/student/profile/",
			{"profile_photo": upload},
			format="multipart",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("profile_photo", response.data)

	def test_profile_remains_student_only(self):
		self.client.credentials()
		unauthenticated_response = self.client.get("/api/student/profile/")

		self.authenticate_as(self.company_user)
		company_response = self.client.get("/api/student/profile/")

		self.authenticate_as(self.admin_user)
		admin_response = self.client.get("/api/student/profile/")

		self.assertEqual(unauthenticated_response.status_code, status.HTTP_401_UNAUTHORIZED)
		self.assertEqual(company_response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertEqual(admin_response.status_code, status.HTTP_403_FORBIDDEN)


class OpportunityDetailTests(APITestCase):
	def setUp(self):
		self.student_user = User.objects.create_user(
			username="student",
			password="test-password",
			role=User.Role.STUDENT,
		)
		self.student = StudentProfile.objects.create(user=self.student_user)
		self.company_user = User.objects.create_user(
			username="company-user",
			password="test-password",
			role=User.Role.COMPANY,
		)
		self.company = CompanyProfile.objects.create(
			user=self.company_user,
			company_name="Acme Labs",
		)
		self.admin_user = User.objects.create_user(
			username="admin",
			password="test-password",
			role=User.Role.ADMIN,
			is_staff=True,
		)
		self.python_skill = Skill.objects.create(name="Python")
		self.react_skill = Skill.objects.create(name="React")
		self.opportunity = Opportunity.objects.create(
			company=self.company,
			title="Backend Intern",
			description="Build APIs.",
			requirements="Django experience",
			opportunity_type=Opportunity.OpportunityType.INTERNSHIP,
			category="Engineering",
			location="Remote",
			work_format=Opportunity.WorkFormat.REMOTE,
			duration="3 months",
			deadline="2026-12-31",
			compensation="$1,000",
		)
		self.opportunity.required_skills.set([self.python_skill, self.react_skill])
		self.inactive_opportunity = Opportunity.objects.create(
			company=self.company,
			title="Closed opportunity",
			description="No longer available.",
			opportunity_type=Opportunity.OpportunityType.FREELANCE,
			work_format=Opportunity.WorkFormat.ONSITE,
			is_active=False,
		)
		self.student.skills.set([self.python_skill])

	def authenticate_as(self, user):
		token = RefreshToken.for_user(user).access_token
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def test_student_gets_active_opportunity_with_matching_data(self):
		self.authenticate_as(self.student_user)

		response = self.client.get(f"/api/opportunities/{self.opportunity.id}/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["company"], self.company.id)
		self.assertEqual(response.data["company_name"], "Acme Labs")
		self.assertEqual(response.data["required_skills"], ["Python", "React"])
		self.assertEqual(response.data["match_percentage"], 50)
		self.assertEqual(response.data["matched_skills"], ["Python"])
		self.assertEqual(response.data["missing_skills"], ["React"])

	def test_company_gets_active_opportunity_without_matching_data(self):
		self.authenticate_as(self.company_user)

		response = self.client.get(f"/api/opportunities/{self.opportunity.id}/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["title"], "Backend Intern")
		self.assertNotIn("match_percentage", response.data)
		self.assertNotIn("matched_skills", response.data)
		self.assertNotIn("missing_skills", response.data)

	def test_inactive_and_unknown_opportunities_return_not_found(self):
		self.authenticate_as(self.student_user)

		inactive_response = self.client.get(
			f"/api/opportunities/{self.inactive_opportunity.id}/"
		)
		unknown_response = self.client.get("/api/opportunities/999999/")

		self.assertEqual(inactive_response.status_code, status.HTTP_404_NOT_FOUND)
		self.assertEqual(unknown_response.status_code, status.HTTP_404_NOT_FOUND)

	def test_endpoint_requires_jwt_and_allows_only_students_and_companies(self):
		unauthenticated_response = self.client.get(
			f"/api/opportunities/{self.opportunity.id}/"
		)
		self.authenticate_as(self.admin_user)
		admin_response = self.client.get(f"/api/opportunities/{self.opportunity.id}/")

		self.assertEqual(unauthenticated_response.status_code, status.HTTP_401_UNAUTHORIZED)
		self.assertEqual(admin_response.status_code, status.HTTP_403_FORBIDDEN)

	def test_existing_opportunity_listing_and_management_apis_still_work(self):
		self.authenticate_as(self.student_user)
		listing_response = self.client.get("/api/opportunities/")
		self.assertEqual(listing_response.status_code, status.HTTP_200_OK)
		self.assertEqual([item["id"] for item in listing_response.data], [self.opportunity.id])

		self.authenticate_as(self.company_user)
		company_listing_response = self.client.get("/api/company/opportunities/")
		company_update_response = self.client.patch(
			f"/api/company/opportunities/{self.opportunity.id}/",
			{"title": "Updated Backend Intern"},
			format="json",
		)
		self.assertEqual(company_listing_response.status_code, status.HTTP_200_OK)
		self.assertEqual(company_update_response.status_code, status.HTTP_200_OK)

		self.authenticate_as(self.admin_user)
		admin_listing_response = self.client.get("/api/admin/opportunities/")
		admin_update_response = self.client.patch(
			f"/api/admin/opportunities/{self.opportunity.id}/",
			{"is_active": False},
			format="json",
		)
		self.assertEqual(admin_listing_response.status_code, status.HTTP_200_OK)
		self.assertEqual(admin_update_response.status_code, status.HTTP_200_OK)

# Create your tests here.


class CompanyCandidateDetailTests(APITestCase):
	def setUp(self):
		self.student_user = User.objects.create_user(
			username="candidate",
			password="test-password",
			email="candidate@example.com",
			first_name="Casey",
			last_name="Candidate",
			role=User.Role.STUDENT,
		)
		self.student = StudentProfile.objects.create(
			user=self.student_user,
			university="UniConnect University",
			major="Computer Science",
			year_of_study=3,
			bio="Backend developer.",
			github_url="https://github.com/candidate",
			linkedin_url="https://linkedin.com/in/candidate",
		)
		self.skill = Skill.objects.create(name="Django")
		self.student.skills.add(self.skill)
		self.company_user = User.objects.create_user(
			username="company-one",
			password="test-password",
			role=User.Role.COMPANY,
		)
		self.company = CompanyProfile.objects.create(
			user=self.company_user,
			company_name="Company One",
		)
		self.other_company_user = User.objects.create_user(
			username="company-two",
			password="test-password",
			role=User.Role.COMPANY,
		)
		self.other_company = CompanyProfile.objects.create(
			user=self.other_company_user,
			company_name="Company Two",
		)
		self.unrelated_company_user = User.objects.create_user(
			username="company-three",
			password="test-password",
			role=User.Role.COMPANY,
		)
		self.company_opportunity = Opportunity.objects.create(
			company=self.company,
			title="Company One Internship",
			description="Build services.",
			opportunity_type=Opportunity.OpportunityType.INTERNSHIP,
			work_format=Opportunity.WorkFormat.REMOTE,
		)
		self.other_opportunity = Opportunity.objects.create(
			company=self.other_company,
			title="Company Two Freelance Project",
			description="Build a project.",
			opportunity_type=Opportunity.OpportunityType.FREELANCE,
			work_format=Opportunity.WorkFormat.ONSITE,
		)
		self.company_application = Application.objects.create(
			student=self.student,
			opportunity=self.company_opportunity,
			status=Application.Status.UNDER_REVIEW,
		)
		self.other_application = Application.objects.create(
			student=self.student,
			opportunity=self.other_opportunity,
			status=Application.Status.APPLIED,
		)
		self.project = PortfolioProject.objects.create(
			student=self.student,
			title="Candidate Project",
			description="A portfolio project.",
			technologies="Django, PostgreSQL",
			project_url="https://candidate.example.com/project",
			github_url="https://github.com/candidate/project",
		)
		self.admin_user = User.objects.create_user(
			username="admin",
			password="test-password",
			role=User.Role.ADMIN,
			is_staff=True,
		)

	def authenticate_as(self, user):
		token = RefreshToken.for_user(user).access_token
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def test_company_can_view_candidate_with_owned_application(self):
		self.authenticate_as(self.company_user)

		response = self.client.get(
			f"/api/company/candidates/{self.student.id}/"
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["user"]["username"], "candidate")
		self.assertEqual(response.data["student_profile"]["skills"], ["Django"])
		self.assertEqual(response.data["applications"][0]["id"], self.company_application.id)
		self.assertEqual(
			response.data["applications"][0]["opportunity_title"],
			"Company One Internship",
		)

	def test_other_company_cannot_view_unrelated_candidate(self):
		self.authenticate_as(self.unrelated_company_user)

		response = self.client.get(
			f"/api/company/candidates/{self.student.id}/"
		)

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_student_and_admin_receive_forbidden(self):
		self.authenticate_as(self.student_user)
		student_response = self.client.get(
			f"/api/company/candidates/{self.student.id}/"
		)

		self.authenticate_as(self.admin_user)
		admin_response = self.client.get(
			f"/api/company/candidates/{self.student.id}/"
		)

		self.assertEqual(student_response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertEqual(admin_response.status_code, status.HTTP_403_FORBIDDEN)

	def test_unknown_student_returns_not_found(self):
		self.authenticate_as(self.company_user)

		response = self.client.get("/api/company/candidates/999999/")

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_portfolio_is_limited_to_requested_candidate(self):
		other_student_user = User.objects.create_user(
			username="other-candidate",
			password="test-password",
			role=User.Role.STUDENT,
		)
		other_student = StudentProfile.objects.create(user=other_student_user)
		other_project = PortfolioProject.objects.create(
			student=other_student,
			title="Other Candidate Project",
		)
		self.authenticate_as(self.company_user)

		response = self.client.get(
			f"/api/company/candidates/{self.student.id}/"
		)

		portfolio_ids = [project["id"] for project in response.data["portfolio"]]
		self.assertEqual(portfolio_ids, [self.project.id])
		self.assertNotIn(other_project.id, portfolio_ids)

	def test_application_context_is_limited_to_authenticated_company(self):
		self.authenticate_as(self.company_user)

		response = self.client.get(
			f"/api/company/candidates/{self.student.id}/"
		)

		application_ids = [application["id"] for application in response.data["applications"]]
		self.assertEqual(application_ids, [self.company_application.id])
		self.assertNotIn(self.other_application.id, application_ids)

	def test_response_does_not_expose_password_or_authentication_data(self):
		self.authenticate_as(self.company_user)

		response = self.client.get(
			f"/api/company/candidates/{self.student.id}/"
		)

		response_text = str(response.data)
		self.assertNotIn("password", response_text.lower())
		self.assertNotIn("access", response.data)
		self.assertNotIn("refresh", response.data)

	def test_existing_company_applications_api_still_works(self):
		self.authenticate_as(self.company_user)

		response = self.client.get("/api/company/applications/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]["id"], self.company_application.id)
