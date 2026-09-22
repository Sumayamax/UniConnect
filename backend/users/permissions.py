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
