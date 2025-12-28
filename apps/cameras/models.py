from django.db import models


class Camera(models.Model):
    nome = models.CharField(max_length=100)
    localizacao = models.CharField(max_length=150)
    url_stream = models.CharField(max_length=255, help_text="RTSP, IP ou URL da câmera")
    ativa = models.BooleanField(default=True)
    criada_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nome} - {self.localizacao}"
