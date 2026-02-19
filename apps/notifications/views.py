from django.shortcuts import render
from django.core.paginator import Paginator

from .models import Notification

def notifications(request):
    query = Notification.objects.filter(user_id=request.user.pk) # type: ignore
    paginator = Paginator(query, 10)

    page = request.GET.get("page", "")
    notifications = paginator.get_page(page)
    return render(request, "notifications/home.html", {"notifications": notifications})
