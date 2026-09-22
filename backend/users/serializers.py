from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import CompanyProfile, Skill, StudentProfile, User


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
