from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import (
    Application,
    CompanyProfile,
    Opportunity,
    PortfolioProject,
    Skill,
    StudentProfile,
    User,
)


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=[User.Role.STUDENT, User.Role.COMPANY],
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data["role"]
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role=role,
        )

        if role == User.Role.STUDENT:
            StudentProfile.objects.create(user=user)
        else:
            CompanyProfile.objects.create(user=user, company_name=user.username)

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class StudentProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    university = serializers.CharField(max_length=255, required=False, allow_blank=True)
    major = serializers.CharField(max_length=255, required=False, allow_blank=True)
    year_of_study = serializers.IntegerField(required=False, allow_null=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    github_url = serializers.URLField(required=False, allow_blank=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)
    skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
    )

    def to_representation(self, instance):
        return {
            "first_name": instance.user.first_name,
            "last_name": instance.user.last_name,
            "university": instance.university,
            "major": instance.major,
            "year_of_study": instance.year_of_study,
            "bio": instance.bio,
            "github_url": instance.github_url,
            "linkedin_url": instance.linkedin_url,
            "skills": list(instance.skills.values_list("name", flat=True)),
        }

    @transaction.atomic
    def update(self, instance, validated_data):
        user = instance.user
        if "first_name" in validated_data:
            user.first_name = validated_data.pop("first_name")
        if "last_name" in validated_data:
            user.last_name = validated_data.pop("last_name")
        user.save()

        skill_names = validated_data.pop("skills", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skill_names is not None:
            skills = []
            for name in skill_names:
                cleaned = name.strip()
                if not cleaned:
                    continue
                skill, _ = Skill.objects.get_or_create(name=cleaned)
                skills.append(skill)
            instance.skills.set(skills)

        return instance


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = (
            "company_name",
            "description",
            "industry",
            "location",
            "website",
            "contact_email",
        )


class OpportunitySerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    company_name = serializers.CharField(source="company.company_name", read_only=True)
    required_skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Opportunity
        fields = (
            "id",
            "company",
            "company_name",
            "title",
            "description",
            "requirements",
            "opportunity_type",
            "required_skills",
            "category",
            "location",
            "work_format",
            "duration",
            "deadline",
            "compensation",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "company",
            "company_name",
            "created_at",
            "updated_at",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["required_skills"] = [
            skill.name for skill in instance.required_skills.all()
        ]
        return data

    @transaction.atomic
    def create(self, validated_data):
        skill_names = validated_data.pop("required_skills", [])
        opportunity = Opportunity.objects.create(**validated_data)

        skills = []
        for name in skill_names:
            cleaned = name.strip()
            if not cleaned:
                continue
            skill, _ = Skill.objects.get_or_create(name=cleaned)
            skills.append(skill)
        opportunity.required_skills.set(skills)
        return opportunity


class CompanyOpportunitySerializer(OpportunitySerializer):
    @transaction.atomic
    def update(self, instance, validated_data):
        skill_names = validated_data.pop("required_skills", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skill_names is not None:
            skills = []
            for name in skill_names:
                cleaned = name.strip()
                if not cleaned:
                    continue
                skill, _ = Skill.objects.get_or_create(name=cleaned)
                skills.append(skill)
            instance.required_skills.set(skills)

        return instance


class StudentOpportunitySerializer(OpportunitySerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        required_skills = [
            skill.name for skill in instance.required_skills.all()
        ]
        student_skills = {
            skill.strip().lower() for skill in self.context.get("student_skills", [])
        }
        normalized_required = [skill.strip().lower() for skill in required_skills]
        matched_skills = [
            skill
            for skill, normalized_skill in zip(required_skills, normalized_required)
            if normalized_skill in student_skills
        ]
        missing_skills = [
            skill
            for skill, normalized_skill in zip(required_skills, normalized_required)
            if normalized_skill not in student_skills
        ]
        data["match_percentage"] = (
            int(len(matched_skills) / len(required_skills) * 100)
            if required_skills
            else 0
        )
        data["matched_skills"] = matched_skills
        data["missing_skills"] = missing_skills
        return data


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ("id", "opportunity", "status", "created_at")
        read_only_fields = fields


class StudentApplicationSerializer(serializers.ModelSerializer):
    opportunity_title = serializers.CharField(source="opportunity.title", read_only=True)
    opportunity_type = serializers.CharField(
        source="opportunity.opportunity_type",
        read_only=True,
    )
    company_name = serializers.CharField(
        source="opportunity.company.company_name",
        read_only=True,
    )

    class Meta:
        model = Application
        fields = (
            "id",
            "status",
            "created_at",
            "updated_at",
            "opportunity",
            "opportunity_title",
            "opportunity_type",
            "company_name",
        )
        read_only_fields = fields


class StudentDashboardApplicationSerializer(serializers.ModelSerializer):
    opportunity_title = serializers.CharField(source="opportunity.title", read_only=True)
    opportunity_type = serializers.CharField(
        source="opportunity.opportunity_type",
        read_only=True,
    )
    company_name = serializers.CharField(
        source="opportunity.company.company_name",
        read_only=True,
    )

    class Meta:
        model = Application
        fields = (
            "id",
            "status",
            "created_at",
            "opportunity",
            "opportunity_title",
            "opportunity_type",
            "company_name",
        )
        read_only_fields = fields


class CompanyApplicationSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    student_username = serializers.CharField(
        source="student.user.username",
        read_only=True,
    )
    student_first_name = serializers.CharField(
        source="student.user.first_name",
        read_only=True,
    )
    student_last_name = serializers.CharField(
        source="student.user.last_name",
        read_only=True,
    )
    student_university = serializers.CharField(source="student.university", read_only=True)
    student_major = serializers.CharField(source="student.major", read_only=True)
    student_skills = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id",
            "status",
            "created_at",
            "updated_at",
            "opportunity",
            "opportunity_title",
            "student_id",
            "student_username",
            "student_first_name",
            "student_last_name",
            "student_university",
            "student_major",
            "student_skills",
        )
        read_only_fields = fields

    opportunity_title = serializers.CharField(source="opportunity.title", read_only=True)

    def get_student_skills(self, instance):
        return list(instance.student.skills.values_list("name", flat=True))


class CompanyDashboardApplicationSerializer(serializers.ModelSerializer):
    opportunity_title = serializers.CharField(source="opportunity.title", read_only=True)
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    username = serializers.CharField(source="student.user.username", read_only=True)
    first_name = serializers.CharField(source="student.user.first_name", read_only=True)
    last_name = serializers.CharField(source="student.user.last_name", read_only=True)
    university = serializers.CharField(source="student.university", read_only=True)
    major = serializers.CharField(source="student.major", read_only=True)

    class Meta:
        model = Application
        fields = (
            "id",
            "status",
            "created_at",
            "opportunity",
            "opportunity_title",
            "student_id",
            "username",
            "first_name",
            "last_name",
            "university",
            "major",
        )
        read_only_fields = fields


class AdminRecentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
        )
        read_only_fields = fields


class AdminRecentOpportunitySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.company_name", read_only=True)

    class Meta:
        model = Opportunity
        fields = (
            "id",
            "title",
            "company_name",
            "opportunity_type",
            "is_active",
            "created_at",
        )
        read_only_fields = fields


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ("status",)


class PortfolioProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioProject
        fields = (
            "id",
            "title",
            "description",
            "project_url",
            "github_url",
            "technologies",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
