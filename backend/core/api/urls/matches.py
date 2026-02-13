from django.urls import path

from core.api.views.matches import MatchSuggestionsView

urlpatterns = [
    path("matches/", MatchSuggestionsView.as_view(), name="match-suggestions"),
]
