from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.contrib.auth.decorators import login_not_required
from django.shortcuts import redirect, render

User = get_user_model()


@login_not_required
def signup(request):
    if request.method == "POST":
        email = request.POST.get("email", "")
        password = request.POST.get("password", "")
        pin = request.POST.get("pin", "")
        full_name = request.POST.get("full_name", "").split(" ")

        try:
            first_name = full_name[0]
            last_name = full_name[-1]
        except IndexError:
            messages.error(request, 'Informe o seu nome completo')
            return render(request, "users/signup.html")

        if not email or not password or not pin or not first_name or not last_name:
            messages.error(request, "Preencha todos os campos")
        elif len(pin) != 4:
            messages.error(request, "O PIN deve conter 4 dígitos")
        elif len(password) < 12:
            messages.error(request, "Palavra-passe deve conter pelo menos 12 caracteres")
        else:
            user = User(email=email, first_name=first_name, last_name=last_name, is_staff=True)
            user.set_password(password)
            user.set_pin(pin)

            user.save()
            messages.success(request, "Dados registados com sucesso")
            return redirect("users:login")
    return render(request, "users/signup.html")


@login_not_required
def login(request):
    if request.method == "POST":
        email = request.POST.get("email", "")
        password = request.POST.get("password", "")

        if not email or not password:
            messages.error(request, "Endereço ou Palavra-passe não informados")
        else:
            user = authenticate(request, email, password)
            if user is not None:
                django_login(request, user)
                return redirect("users:pin")
        return render(request, "users/login.html")
    return render(request, "users/login.html")


@login_not_required
def pin(request):
    return render(request, "users/pin.html")


def logout(request):
    django_logout(request)
    return redirect("users:login")
