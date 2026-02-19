from django.shortcuts import get_object_or_404, render, redirect
from django.core.paginator import Paginator

from .models import Notification


def notifications(request):
    ctx = {}
    query = Notification.objects.select_related("camera").filter(  # type: ignore
        user_id=request.user.pk, deleted=False
    )
    search_query = request.GET.get("search-query", "A")

    if search_query in ["A", "NR", "R"]:
        ctx["search_query"] = search_query

        match search_query:
            case "NR":
                query = query.filter(readed=False)
            case "R":
                query = query.filter(readed=True)

    paginator = Paginator(query, 5)

    page = request.GET.get("page", "")
    notifications = paginator.get_page(page)
    ctx["notifications"] = notifications
    return render(request, "notifications/home.html", ctx)


def delete_notification(request, notification_id: int):
    notification = get_object_or_404(Notification, id=notification_id)
    notification.deleted = True
    notification.save(update_fields=["deleted"])
    return redirect("notifications:home")
