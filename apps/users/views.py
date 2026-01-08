import json
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login as dj_login, logout as dj_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model

User = get_user_model()

# ---------- PÁGINAS HTML ----------

def signup(request):
    return render(request, "users/signup.html")


def login_page(request):
    return render(request, "users/login.html")


# ---------- API ----------

@csrf_exempt
def signup_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método não permitido"}, status=405)

    data = json.loads(request.body)
    phone = data.get("phone")
    pin = data.get("pin")

    if not phone or not pin:
        return JsonResponse({"error": "Telefone e PIN obrigatórios"}, status=400)

    if User.objects.filter(phone=phone).exists():
        return JsonResponse({"error": "Usuário já existe"}, status=400)

    user = User.objects.create_user(phone=phone)
    user.set_pin(pin)
    user.save()

    return JsonResponse({"message": "Conta criada com sucesso"})


@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método não permitido"}, status=405)

    data = json.loads(request.body)
    phone = data.get("phone")
    pin = data.get("pin")

    try:
        user = User.objects.get(phone=phone)
    except User.DoesNotExist:
        return JsonResponse({"error": "Usuário não encontrado"}, status=404)

    if not user.check_pin(pin):
        return JsonResponse({"error": "PIN inválido"}, status=401)

    dj_login(request, user)
    return JsonResponse({"message": "Login efetuado"})


@login_required
def dashboard(request):
    return JsonResponse({
        "user": request.user.phone,
        "status": "sessão ativa"
    })


@login_required
def logout_view(request):
    dj_logout(request)
    return redirect("/users/login/")
