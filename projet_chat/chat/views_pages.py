from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import RegisterForm, LoginForm 
from .models import Salon, Channel
from django.shortcuts import get_object_or_404
from django.utils.text import slugify

# Page d'accueil
def index(request):
    salons = []
    # On affiche la liste seulement si le gars est connecté
    if request.user.is_authenticated:
        salons = Salon.objects.all()
    
    return render(request, 'chat/index.html', {'salons': salons})

# Page du salon (protégée)
@login_required 
@login_required
def room(request, slug):
    salon = get_object_or_404(Salon, slug=slug)
    return render(request, 'chat/room.html', {'slug': slug, 'salon': salon})


@login_required
def creer_salon(request):
    """Create a new Salon (channel)."""
    if request.method == 'POST':
        nom = request.POST.get('nom', '').strip()
        description = request.POST.get('description', '').strip()
        if not nom:
            messages.error(request, "Le nom du salon est requis.")
        else:
            base_slug = slugify(nom)
            slug = base_slug or 'salon'
            # ensure uniqueness
            suffix = 0
            unique_slug = slug
            while Salon.objects.filter(slug=unique_slug).exists():
                suffix += 1
                unique_slug = f"{slug}-{suffix}"

            salon = Salon.objects.create(nom=nom, slug=unique_slug, description=description, createur=request.user)
            messages.success(request, f"Salon '{salon.nom}' créé.")
            return redirect('room', slug=salon.slug)

    return render(request, 'chat/create_salon.html')


@login_required
def supprimer_salon(request, slug):
    """Delete a Salon."""
    salon = get_object_or_404(Salon, slug=slug)
    
    if request.method == 'POST':
        salon.delete()
        messages.success(request, f"Salon '{salon.nom}' supprimé.")
        return redirect('index')
    
    # GET request - show confirmation page
    return render(request, 'chat/delete_salon.html', {'salon': salon})


@login_required
def creer_channel(request, salon_slug):
    """Create a new Channel within a Salon."""
    salon = get_object_or_404(Salon, slug=salon_slug)
    
    if request.method == 'POST':
        nom = request.POST.get('nom', '').strip()
        description = request.POST.get('description', '').strip()
        if not nom:
            messages.error(request, "Le nom du canal est requis.")
        else:
            base_slug = slugify(nom)
            slug = base_slug or 'channel'
            # ensure uniqueness within the salon
            suffix = 0
            unique_slug = slug
            while Channel.objects.filter(salon=salon, slug=unique_slug).exists():
                suffix += 1
                unique_slug = f"{slug}-{suffix}"

            channel = Channel.objects.create(nom=nom, slug=unique_slug, description=description, salon=salon)
            messages.success(request, f"Canal '{channel.nom}' créé dans '{salon.nom}'.")
            return redirect('channel', salon_slug=salon.slug, channel_slug=channel.slug)

    return render(request, 'chat/create_channel.html', {'salon': salon})


@login_required
def channel(request, salon_slug, channel_slug):
    """Page du canal (protégée)."""
    salon = get_object_or_404(Salon, slug=salon_slug)
    channel = get_object_or_404(Channel, slug=channel_slug, salon=salon)
    return render(request, 'chat/channel.html', {
        'salon_slug': salon_slug, 
        'channel_slug': channel_slug, 
        'salon': salon,
        'channel': channel
    })


@login_required
def supprimer_channel(request, salon_slug, channel_slug):
    """Delete a Channel."""
    salon = get_object_or_404(Salon, slug=salon_slug)
    channel = get_object_or_404(Channel, slug=channel_slug, salon=salon)
    
    if request.method == 'POST':
        channel.delete()
        messages.success(request, f"Canal '{channel.nom}' supprimé.")
        return redirect('room', slug=salon.slug)
    
    # GET request - show confirmation page
    return render(request, 'chat/delete_channel.html', {
        'salon': salon,
        'channel': channel
    })

# --- Authentification ---

def inscription(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user) # On le connecte direct après l'inscription
            messages.success(request, f"Bienvenue {user.username} !")
            return redirect('index')
        else:
            messages.error(request, "Il y a des erreurs dans le formulaire.")
    else:
        form = RegisterForm()
    return render(request, 'chat/register.html', {'form': form})

def connexion(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, "Connexion réussie.")
            return redirect('index')
        else:
            messages.error(request, "Erreur dans le pseudo ou le mot de passe.")
    else:
        form = LoginForm()
    return render(request, 'chat/login.html', {'form': form})

def deconnexion(request):
    logout(request)
    messages.info(request, "Vous êtes déconnecté.")
    return redirect('login')