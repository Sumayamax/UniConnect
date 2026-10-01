from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        COMPANY = "company", "Company"
        ADMIN = "admin", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    def __str__(self):
        return self.username


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    university = models.CharField(max_length=255, blank=True)
    major = models.CharField(max_length=255, blank=True)
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True)
    bio = models.TextField(blank=True)
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    skills = models.ManyToManyField("Skill", blank=True, related_name="students")

    def __str__(self):
        return f"{self.user.username}'s student profile"


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class CompanyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="company_profile")
    company_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    industry = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.company_name


class Opportunity(models.Model):
    class OpportunityType(models.TextChoices):
        INTERNSHIP = "internship", "Internship"
        FREELANCE = "freelance", "Freelance"

    class WorkFormat(models.TextChoices):
        ONSITE = "onsite", "Onsite"
        REMOTE = "remote", "Remote"
        HYBRID = "hybrid", "Hybrid"

    company = models.ForeignKey(
        CompanyProfile,
        on_delete=models.CASCADE,
        related_name="opportunities",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    opportunity_type = models.CharField(
        max_length=20,
        choices=OpportunityType.choices,
    )
    required_skills = models.ManyToManyField(
        Skill,
        blank=True,
        related_name="opportunities",
    )
    category = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    work_format = models.CharField(
        max_length=10,
        choices=WorkFormat.choices,
    )
    duration = models.CharField(max_length=255, blank=True)
    deadline = models.DateField(null=True, blank=True)
    compensation = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = "applied", "Applied"
        UNDER_REVIEW = "under_review", "Under review"
        INTERVIEW = "interview", "Interview"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    opportunity = models.ForeignKey(
        Opportunity,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPLIED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("student", "opportunity"),
                name="unique_student_opportunity_application",
            ),
        ]

    def __str__(self):
        return f"{self.student} - {self.opportunity}"


class PortfolioProject(models.Model):
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="portfolio_projects",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    technologies = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
