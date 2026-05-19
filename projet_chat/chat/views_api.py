from django.http import JsonResponse

def api_exemple(request):
    return JsonResponse({"status": "ok"})