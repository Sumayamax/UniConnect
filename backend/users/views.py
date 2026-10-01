from datetime import datetime

from django.contrib.auth import authenticate
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Application,
    CompanyProfile,
    Opportunity,
    PortfolioProject,
    StudentProfile,
    User,
)
from .permissions import IsAdmin, IsCompany, IsOpportunityUser, IsStudent
from .serializers import (
    CompanyProfileSerializer,
    ApplicationSerializer,
    ApplicationStatusUpdateSerializer,
    LoginSerializer,
    OpportunitySerializer,
    PortfolioProjectSerializer,
    StudentOpportunitySerializer,
    RegisterSerializer,
    CompanyApplicationSerializer,
    CompanyDashboardApplicationSerializer,
    CompanyOpportunitySerializer,
    AdminRecentOpportunitySerializer,
    AdminRecentUserSerializer,
    AdminUserStatusSerializer,
    AdminOpportunitySerializer,
    AdminOpportunityStatusSerializer,
    AdminCompanySerializer,
    AdminCompanyStatusSerializer,
    AdminApplicationSerializer,
    StudentApplicationSerializer,
    StudentDashboardApplicationSerializer,
    StudentProfileSerializer,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(
        request,
        username=serializer.validated_data["username"],
        password=serializer.validated_data["password"],
    )

    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        }
    )


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated, IsStudent])
def student_profile(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(StudentProfileSerializer(profile).data)

    serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsStudent])
def student_portfolio(request):
    student, _ = StudentProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        projects = student.portfolio_projects.all().order_by("-created_at")
        return Response(PortfolioProjectSerializer(projects, many=True).data)

    serializer = PortfolioProjectSerializer(data=request.data)
    if serializer.is_valid():
        project = serializer.save(student=student)
        return Response(
            PortfolioProjectSerializer(project).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated, IsStudent])
def student_portfolio_detail(request, project_id):
    student, _ = StudentProfile.objects.get_or_create(user=request.user)
    project = get_object_or_404(
        PortfolioProject,
        id=project_id,
        student=student,
    )

    if request.method == "DELETE":
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = PortfolioProjectSerializer(project, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated, IsCompany])
def company_profile(request):
    profile, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={"company_name": request.user.username},
    )

    if request.method == "GET":
        return Response(CompanyProfileSerializer(profile).data)

    serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsOpportunityUser])
def create_opportunity(request):
    if request.method == "GET":
        opportunities = Opportunity.objects.filter(is_active=True)
        search = request.query_params.get("search")
        opportunity_type = request.query_params.get("opportunity_type")
        category = request.query_params.get("category")
        location = request.query_params.get("location")
        work_format = request.query_params.get("work_format")
        skill = request.query_params.get("skill")

        if search:
            opportunities = opportunities.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(requirements__icontains=search)
            )
        if opportunity_type:
            opportunities = opportunities.filter(opportunity_type__iexact=opportunity_type)
        if category:
            opportunities = opportunities.filter(category__icontains=category)
        if location:
            opportunities = opportunities.filter(location__icontains=location)
        if work_format:
            opportunities = opportunities.filter(work_format__iexact=work_format)
        if skill:
            opportunities = opportunities.filter(required_skills__name__iexact=skill)

        opportunities = opportunities.distinct().prefetch_related("required_skills").order_by(
            "-created_at"
        )
        if request.user.role == User.Role.STUDENT:
            student, _ = StudentProfile.objects.get_or_create(user=request.user)
            student_skills = list(student.skills.values_list("name", flat=True))
            serializer = StudentOpportunitySerializer(
                opportunities,
                many=True,
                context={"student_skills": student_skills},
            )
        else:
            serializer = OpportunitySerializer(opportunities, many=True)
        return Response(serializer.data)

    company, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={"company_name": request.user.username},
    )
    serializer = OpportunitySerializer(data=request.data)
    if serializer.is_valid():
        opportunity = serializer.save(company=company)
        return Response(
            OpportunitySerializer(opportunity).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompany])
def company_opportunities(request):
    company, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={"company_name": request.user.username},
    )
    opportunities = (
        Opportunity.objects.filter(company=company)
        .prefetch_related("required_skills")
        .order_by("-created_at")
    )
    return Response(CompanyOpportunitySerializer(opportunities, many=True).data)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated, IsCompany])
def company_opportunity_detail(request, opportunity_id):
    company, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={"company_name": request.user.username},
    )
    opportunity = get_object_or_404(
        Opportunity,
        id=opportunity_id,
        company=company,
    )

    if request.method == "DELETE":
        opportunity.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = CompanyOpportunitySerializer(
        opportunity,
        data=request.data,
        partial=True,
    )
    if serializer.is_valid():
        serializer.save()
        return Response(CompanyOpportunitySerializer(opportunity).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsStudent])
def apply_to_opportunity(request, opportunity_id):
    opportunity = get_object_or_404(
        Opportunity,
        id=opportunity_id,
        is_active=True,
    )
    student, _ = StudentProfile.objects.get_or_create(user=request.user)

    if Application.objects.filter(
        student=student,
        opportunity=opportunity,
    ).exists():
        return Response(
            {"detail": "You have already applied to this opportunity."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            application = Application.objects.create(
                student=student,
                opportunity=opportunity,
                status=Application.Status.APPLIED,
            )
    except IntegrityError:
        return Response(
            {"detail": "You have already applied to this opportunity."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsStudent])
def student_applications(request):
    student, _ = StudentProfile.objects.get_or_create(user=request.user)
    applications = (
        Application.objects.filter(student=student)
        .select_related("opportunity", "opportunity__company")
        .order_by("-created_at")
    )
    return Response(StudentApplicationSerializer(applications, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsStudent])
def student_dashboard(request):
    student, _ = StudentProfile.objects.get_or_create(user=request.user)
    application_counts = Application.objects.filter(student=student).aggregate(
        total=Count("id"),
        applied=Count("id", filter=Q(status=Application.Status.APPLIED)),
        under_review=Count("id", filter=Q(status=Application.Status.UNDER_REVIEW)),
        interview=Count("id", filter=Q(status=Application.Status.INTERVIEW)),
        accepted=Count("id", filter=Q(status=Application.Status.ACCEPTED)),
        rejected=Count("id", filter=Q(status=Application.Status.REJECTED)),
    )
    recent_applications = (
        Application.objects.filter(student=student)
        .select_related("opportunity", "opportunity__company")
        .order_by("-created_at")[:5]
    )
    student_skills = list(student.skills.values_list("name", flat=True))
    opportunities = (
        Opportunity.objects.filter(is_active=True)
        .select_related("company")
        .prefetch_related("required_skills")
    )
    recommended_data = StudentOpportunitySerializer(
        opportunities,
        many=True,
        context={"student_skills": student_skills},
    ).data
    recommended_data = sorted(
        recommended_data,
        key=lambda opportunity: (
            -opportunity["match_percentage"],
            -datetime.fromisoformat(
                opportunity["created_at"].replace("Z", "+00:00")
            ).timestamp(),
        ),
    )[:5]

    return Response(
        {
            "total_applications": application_counts["total"],
            "applications_by_status": {
                "applied": application_counts["applied"],
                "under_review": application_counts["under_review"],
                "interview": application_counts["interview"],
                "accepted": application_counts["accepted"],
                "rejected": application_counts["rejected"],
            },
            "portfolio_projects": student.portfolio_projects.count(),
            "skills_count": len(student_skills),
            "recent_applications": StudentDashboardApplicationSerializer(
                recent_applications,
                many=True,
            ).data,
            "recommended_opportunities": recommended_data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompany])
def company_applications(request):
    company, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={"company_name": request.user.username},
    )
    applications = (
        Application.objects.filter(opportunity__company=company)
        .select_related("opportunity", "student", "student__user")
        .prefetch_related("student__skills")
        .order_by("-created_at")
    )
    return Response(CompanyApplicationSerializer(applications, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompany])
def company_dashboard(request):
    company, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={"company_name": request.user.username},
    )
    opportunity_counts = Opportunity.objects.filter(company=company).aggregate(
        total=Count("id"),
        active=Count("id", filter=Q(is_active=True)),
        closed=Count("id", filter=Q(is_active=False)),
    )
    application_counts = Application.objects.filter(
        opportunity__company=company,
    ).aggregate(
        total=Count("id"),
        applied=Count("id", filter=Q(status=Application.Status.APPLIED)),
        under_review=Count("id", filter=Q(status=Application.Status.UNDER_REVIEW)),
        interview=Count("id", filter=Q(status=Application.Status.INTERVIEW)),
        accepted=Count("id", filter=Q(status=Application.Status.ACCEPTED)),
        rejected=Count("id", filter=Q(status=Application.Status.REJECTED)),
    )
    recent_applications = (
        Application.objects.filter(opportunity__company=company)
        .select_related("opportunity", "student", "student__user")
        .order_by("-created_at")[:5]
    )

    return Response(
        {
            "total_opportunities": opportunity_counts["total"],
            "active_opportunities": opportunity_counts["active"],
            "closed_opportunities": opportunity_counts["closed"],
            "total_applications": application_counts["total"],
            "applications_by_status": {
                "applied": application_counts["applied"],
                "under_review": application_counts["under_review"],
                "interview": application_counts["interview"],
                "accepted": application_counts["accepted"],
                "rejected": application_counts["rejected"],
            },
            "recent_applications": CompanyDashboardApplicationSerializer(
                recent_applications,
                many=True,
            ).data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_dashboard(request):
    user_counts = User.objects.aggregate(
        total=Count("id"),
        students=Count("id", filter=Q(role=User.Role.STUDENT)),
        companies=Count("id", filter=Q(role=User.Role.COMPANY)),
    )
    opportunity_counts = Opportunity.objects.aggregate(
        total=Count("id"),
        active=Count("id", filter=Q(is_active=True)),
        closed=Count("id", filter=Q(is_active=False)),
    )
    application_counts = Application.objects.aggregate(
        total=Count("id"),
        applied=Count("id", filter=Q(status=Application.Status.APPLIED)),
        under_review=Count("id", filter=Q(status=Application.Status.UNDER_REVIEW)),
        interview=Count("id", filter=Q(status=Application.Status.INTERVIEW)),
        accepted=Count("id", filter=Q(status=Application.Status.ACCEPTED)),
        rejected=Count("id", filter=Q(status=Application.Status.REJECTED)),
    )
    recent_users = User.objects.order_by("-date_joined")[:5]
    recent_opportunities = (
        Opportunity.objects.select_related("company")
        .order_by("-created_at")[:5]
    )

    return Response(
        {
            "total_users": user_counts["total"],
            "total_students": user_counts["students"],
            "total_companies": user_counts["companies"],
            "total_opportunities": opportunity_counts["total"],
            "active_opportunities": opportunity_counts["active"],
            "closed_opportunities": opportunity_counts["closed"],
            "total_applications": application_counts["total"],
            "applications_by_status": {
                "applied": application_counts["applied"],
                "under_review": application_counts["under_review"],
                "interview": application_counts["interview"],
                "accepted": application_counts["accepted"],
                "rejected": application_counts["rejected"],
            },
            "recent_users": AdminRecentUserSerializer(recent_users, many=True).data,
            "recent_opportunities": AdminRecentOpportunitySerializer(
                recent_opportunities,
                many=True,
            ).data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_users(request):
    users = User.objects.order_by("-date_joined")
    return Response(AdminRecentUserSerializer(users, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_user_detail(request, user_id):
    user = get_object_or_404(User, id=user_id)

    if user.id == request.user.id and request.data.get("is_active") is False:
        return Response(
            {"detail": "You cannot deactivate your own admin account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if set(request.data.keys()) != {"is_active"}:
        return Response(
            {"detail": "Only the is_active field can be updated."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = AdminUserStatusSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(AdminRecentUserSerializer(user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_opportunities(request):
    opportunities = (
        Opportunity.objects.select_related("company")
        .prefetch_related("required_skills")
        .order_by("-created_at")
    )
    return Response(AdminOpportunitySerializer(opportunities, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_opportunity_detail(request, opportunity_id):
    opportunity = get_object_or_404(Opportunity, id=opportunity_id)

    if set(request.data.keys()) != {"is_active"}:
        return Response(
            {"detail": "Only the is_active field can be updated."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = AdminOpportunityStatusSerializer(opportunity, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(AdminOpportunitySerializer(opportunity).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_companies(request):
    companies = (
        CompanyProfile.objects.select_related("user")
        .order_by("-user__date_joined")
    )
    return Response(AdminCompanySerializer(companies, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_company_detail(request, company_id):
    company = get_object_or_404(
        CompanyProfile.objects.select_related("user"),
        id=company_id,
    )
    supported_fields = {"is_verified", "is_active"}
    if not request.data or not set(request.data.keys()).issubset(supported_fields):
        return Response(
            {"detail": "Only is_verified and is_active can be updated."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = AdminCompanyStatusSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    values = serializer.validated_data
    if "is_verified" in values:
        company.is_verified = values["is_verified"]
        company.save(update_fields=["is_verified"])
    if "is_active" in values:
        company.user.is_active = values["is_active"]
        company.user.save(update_fields=["is_active"])

    return Response(AdminCompanySerializer(company).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_applications(request):
    applications = (
        Application.objects.select_related(
            "student",
            "student__user",
            "opportunity",
            "opportunity__company",
        )
        .order_by("-created_at")
    )
    return Response(AdminApplicationSerializer(applications, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompany])
def update_company_application(request, application_id):
    company, _ = CompanyProfile.objects.get_or_create(
        user=request.user,
        defaults={"company_name": request.user.username},
    )
    application = get_object_or_404(
        Application.objects.select_related("opportunity", "student", "student__user"),
        id=application_id,
        opportunity__company=company,
    )

    if set(request.data.keys()) != {"status"}:
        return Response(
            {"detail": "Only the status field can be updated."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = ApplicationStatusUpdateSerializer(application, data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(CompanyApplicationSerializer(application).data)
