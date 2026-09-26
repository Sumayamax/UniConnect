from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Application, Opportunity, PortfolioProject, Skill, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")

    fieldsets = UserAdmin.fieldsets + (
        ("UniConnect", {"fields": ("role",)}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("UniConnect", {"fields": ("role",)}),
    )


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "company",
        "opportunity_type",
        "work_format",
        "is_active",
        "deadline",
    )
    list_filter = ("opportunity_type", "work_format", "is_active")
    search_fields = ("title", "company__company_name", "category")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("student", "opportunity", "status", "created_at", "updated_at")
    list_filter = ("status",)
    search_fields = (
        "student__user__username",
        "student__user__email",
        "opportunity__title",
    )


@admin.register(PortfolioProject)
class PortfolioProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "student", "created_at", "updated_at")
    search_fields = ("title", "student__user__username", "technologies")
