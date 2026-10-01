"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import (
    apply_to_opportunity,
    company_profile,
    company_applications,
    company_opportunities,
    company_opportunity_detail,
    company_dashboard,
    admin_dashboard,
    admin_users,
    admin_user_detail,
    admin_opportunities,
    admin_opportunity_detail,
    admin_companies,
    admin_company_detail,
    admin_applications,
    update_company_application,
    create_opportunity,
    login,
    register,
    student_profile,
    student_applications,
    student_dashboard,
    student_portfolio,
    student_portfolio_detail,
)

from .views import api_root

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root),
    path('api/register/', register),
    path('api/login/', login),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/student/profile/', student_profile),
    path('api/student/portfolio/', student_portfolio),
    path('api/student/portfolio/<int:project_id>/', student_portfolio_detail),
    path('api/company/profile/', company_profile),
    path('api/opportunities/', create_opportunity),
    path('api/company/opportunities/', company_opportunities),
    path('api/company/opportunities/<int:opportunity_id>/', company_opportunity_detail),
    path('api/company/dashboard/', company_dashboard),
    path('api/admin/dashboard/', admin_dashboard),
    path('api/admin/users/', admin_users),
    path('api/admin/users/<int:user_id>/', admin_user_detail),
    path('api/admin/opportunities/', admin_opportunities),
    path('api/admin/opportunities/<int:opportunity_id>/', admin_opportunity_detail),
    path('api/admin/companies/', admin_companies),
    path('api/admin/companies/<int:company_id>/', admin_company_detail),
    path('api/admin/applications/', admin_applications),
    path('api/opportunities/<int:opportunity_id>/apply/', apply_to_opportunity),
    path('api/applications/', student_applications),
    path('api/student/dashboard/', student_dashboard),
    path('api/company/applications/', company_applications),
    path('api/company/applications/<int:application_id>/', update_company_application),
]
