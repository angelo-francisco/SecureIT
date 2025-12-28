from django.shortcuts import get_object_or_404, redirect, render

from .models import Camera


def home_page(request):
    return render(request, "home_page.html")


def lista_cameras(request):
    """
    Lista todas as câmaras cadastradas
    """
    cameras = Camera.objects.all()
    return render(request, "cameras/listar.html", {"cameras": cameras})


def criar_camera(request):
    """
    Cadastra uma nova câmara
    """
    if request.method == "POST":
        Camera.objects.create(
            nome=request.POST.get("nome"),
            localizacao=request.POST.get("localizacao"),
            url_stream=request.POST.get("url_stream"),
        )
        return redirect("lista_cameras")

    return render(request, "cameras/criar.html")


def eliminar_camera(request, id):
    """
    Elimina uma câmara pelo ID
    """
    camera = get_object_or_404(Camera, id=id)
    camera.delete()
    return redirect("lista_cameras")


def ver_camera(request, id):
    """
    Mostra os detalhes de uma câmara
    (stream entra aqui depois)
    """
    camera = get_object_or_404(Camera, id=id)
    return render(request, "cameras/ver.html", {"camera": camera})
