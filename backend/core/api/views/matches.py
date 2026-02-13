from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.matching import get_swap_suggestions


class MatchSuggestionsView(APIView):
    """
    GET /api/matches/

    Returns ranked swap suggestions for the authenticated user.
    Each suggestion pairs one of the user's active swap-listed cards
    with another user's active swap-listed card, scored by value
    similarity, brand preference, reputation, and recency.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = request.query_params.get("limit", 10)
        try:
            limit = int(limit)
            if limit < 1:
                limit = 10
        except (TypeError, ValueError):
            limit = 10

        suggestions = get_swap_suggestions(request.user, limit=limit)
        return Response(suggestions)
