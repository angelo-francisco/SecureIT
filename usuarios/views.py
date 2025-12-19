from django.shortcuts import render
from django.http import HttpResponse

def test(request):
  return HttpResponse('Minha primeira view no django. Olá, mundo!')
