from django.db.models import Avg

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.pagination import StandardPagination
from core.api.serializers.reviews import ReviewCreateSerializer, ReviewSerializer
from core.models import Review


class ReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(
            target_user=self.request.user
        ).select_related("reviewer", "target_user", "trade", "sale")


class ReviewDetailView(generics.RetrieveAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.select_related("reviewer", "target_user", "trade", "sale")


class SellerRatingSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = Review.objects.filter(target_user=request.user)
        stats = reviews.aggregate(
            average_rating=Avg("rating"),
        )
        distribution = {}
        for star in range(1, 6):
            distribution[str(star)] = reviews.filter(rating=star).count()

        return Response({
            "total_reviews": reviews.count(),
            "average_rating": round(stats["average_rating"] or 0, 2),
            "distribution": distribution,
        })
