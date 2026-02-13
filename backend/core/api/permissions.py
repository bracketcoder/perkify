from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Object-level permission: only allow the owner of a gift card to access it.

    Checks ``obj.owner == request.user``.  Falls back to ``obj.user`` for
    models that use a ``user`` foreign key instead of ``owner``.
    """

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "owner"):
            return obj.owner == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user
        return False


class IsTradeParticipant(BasePermission):
    """
    Object-level permission for Trade objects.

    Grants access only when ``request.user`` is either the initiator
    or the responder of the trade.
    """

    def has_object_permission(self, request, view, obj):
        return request.user in [obj.initiator, obj.responder]


class IsSaleParticipant(BasePermission):
    """
    Object-level permission for Sale objects.

    Grants access only when ``request.user`` is either the buyer
    or the seller of the sale.
    """

    def has_object_permission(self, request, view, obj):
        return request.user in [obj.buyer, obj.seller]


class IsAdminRole(BasePermission):
    """
    View-level permission: only allow users whose ``role`` field is ``"admin"``.

    Also grants access if the Django ``is_staff`` flag is set, so that
    superusers created via ``createsuperuser`` are not locked out.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == "admin" or request.user.is_staff


class IsActiveUser(BasePermission):
    """
    View-level permission: only allow users whose account status is ``"active"``.

    Rejects users who are restricted, suspended, or banned.
    """

    message = "Your account is not active. Please contact support."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.status == "active"


class IsNotRestricted(BasePermission):
    """
    View-level permission: block users whose account status is ``"restricted"``.

    Restricted users are placed in a view-only mode until an admin lifts the
    restriction.  Suspended and banned users are handled separately by the
    login flow, but this permission also rejects them for defence-in-depth.
    """

    message = "Your account is restricted. You cannot perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.status != "restricted"


# ── Backward-compatible aliases ──
# ``IsAdminUser`` is used by existing admin API views.  Keep it as an alias
# for ``IsAdminRole`` so that ``from core.api.permissions import IsAdminUser``
# continues to work without modifying those files.
IsAdminUser = IsAdminRole
