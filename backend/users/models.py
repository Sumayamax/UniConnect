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

    def __str__(self):
        return self.company_name
