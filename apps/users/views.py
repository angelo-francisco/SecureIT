import json

from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt

from apps.panel.models import Configuration

from .utils import pin_not_required, without_login

User = get_user_model()


@without_login
def signup(request):
    if request.method == "POST":
        email = request.POST.get("email", "")
        password = request.POST.get("password", "")
        pin = request.POST.get("pin-signup", "")
        full_name = request.POST.get("full_name", "").split(" ")

        try:
            if len(full_name) < 2:
                raise ValueError
            first_name = full_name[0]
            last_name = full_name[-1]
        except ValueError:
            messages.error(request, "Informe pelo menos o seu primeiro e último nome")
            return render(request, "users/signup.html")

        if not email or not password or not pin or not first_name or not last_name:
            messages.error(request, "Preencha todos os campos")
        elif len(pin) != 4:
            messages.error(request, "O PIN deve conter 4 dígitos")
        elif len(password) < 12:
            messages.error(
                request, "Palavra-passe deve conter pelo menos 12 caracteres"
            )
        elif User.objects.filter(email=email).exists():
            messages.error(request, "Este e-mail já foi cadastrado.")
        else:
            user = User(email=email, first_name=first_name, last_name=last_name)
            user.set_password(password)
            user.set_pin(pin) # type: ignore

            user.save()
            Configuration.objects.create(user=user)

            messages.success(request, "Dados registados com sucesso")
            return redirect("users:login")
    return render(request, "users/signup.html")


@without_login
def login(request):
    if request.method == "POST":
        email = request.POST.get("email", "")
        password = request.POST.get("password", "")

        if not email or not password:
            messages.error(request, "Endereço ou Palavra-passe não informados")
        else:
            user = authenticate(request, username=None, password=password, email=email)
            if user is not None:
                django_login(request, user)

                messages.success(request, "Sessão iniciada com sucesso")
                return redirect("panel:home")
        messages.error(request, "Endereço ou palavra-passe incorrectos")
        return render(request, "users/login.html")
    return render(request, "users/login.html")


@pin_not_required
@csrf_exempt
def pin(request):
    if request.method == "POST":
        data = json.loads(request.body)
        raw_pin = data.get("pin", "")

        if not raw_pin or len(raw_pin) != 4:
            return JsonResponse({"error": "PIN incompleto"}, status=400)
        else:
            user = request.user
            if user.check_pin(raw_pin):
                response = JsonResponse({"success": True})
                response.set_cookie("pin_verified", True)  # type: ignore
                return response
            return JsonResponse({"error": "PIN incorrecto"}, status=400)
    return JsonResponse({"error": "Método proibido"}, status=405)


def lock(request):
    response = JsonResponse({"success": True})
    response.delete_cookie("pin_verified")
    return response


def logout(request):
    response = redirect("users:login")
    response.delete_cookie("pin_verified")
    django_logout(request)
    return response
