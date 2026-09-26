from rest_framework.permissions import BasePermission

from .models import User


class IsStudent(BasePermission):
    message = "Only students can access this endpoint."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.STUDENT
        )


class IsCompany(BasePermission):
    message = "Only companies can access this endpoint."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.COMPANY
        )


class IsAdmin(BasePermission):
    message = "Only admins can access this endpoint."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class IsOpportunityUser(BasePermission):
    message = "Students and companies can view opportunities; only companies can create them."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method == "POST":
            return request.user.role == User.Role.COMPANY

        return request.user.role in (User.Role.STUDENT, User.Role.COMPANY)
