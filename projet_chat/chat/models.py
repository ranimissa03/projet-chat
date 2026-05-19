from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.core.exceptions import ValidationError

# Le salon de discussion
class Salon(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    createur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='salons_crees')

    # Pour créer le lien vers le salon automatiquement
    def get_absolute_url(self):
        return reverse('room', args=[self.slug])

    # Affichage dans l'admin
    def __str__(self):
        return self.nom

    def is_admin(self, user):
        """Vérifie si l'utilisateur est administrateur du salon"""
        return user == self.createur or self.roles.filter(user=user, role='admin').exists()

    def is_moderator(self, user):
        """Vérifie si l'utilisateur est modérateur du salon"""
        return self.is_admin(user) or self.roles.filter(user=user, role='moderator').exists()

    def is_banned(self, user):
        """Vérifie si l'utilisateur est banni du salon"""
        return self.bans.filter(user=user, is_active=True).exists()

    def can_manage_users(self, user):
        """Vérifie si l'utilisateur peut gérer les utilisateurs (admin seulement)"""
        return self.is_admin(user)

    def can_moderate(self, user):
        """Vérifie si l'utilisateur peut modérer (admin ou modérateur)"""
        return self.is_moderator(user)

# Les canaux de discussion
class Channel(models.Model):
    nom = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='channels')

    # Pour créer le lien vers le canal automatiquement
    def get_absolute_url(self):
        return reverse('channel', args=[self.salon.slug, self.slug])

    # Affichage dans l'admin
    def __str__(self):
        return f"{self.salon.nom} - {self.nom}"

    class Meta:
        unique_together = ('salon', 'nom')

# Les messages postés
class Message(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    auteur = models.ForeignKey(User, on_delete=models.CASCADE)
    contenu = models.TextField(blank=True)
    fichier = models.FileField(upload_to='chat_files/%Y/%m/%d/', blank=True, null=True)
    date_envoi = models.DateTimeField(auto_now_add=True)

    # On trie par date pour avoir les vieux messages en premier
    class Meta:
        ordering = ['date_envoi']

    def __str__(self):
        return f"{self.auteur} : {self.contenu}"

    def get_chat_entity(self):
        """Retourne l'entité de chat (salon ou canal) associée au message."""
        return self.salon or self.channel

    def get_chat_entity_name(self):
        """Retourne le nom de l'entité de chat."""
        entity = self.get_chat_entity()
        return entity.nom if entity else "Unknown"

# Rôles des utilisateurs dans les salons
class SalonRole(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('moderator', 'Modérateur'),
    ]
    
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='roles')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    class Meta:
        unique_together = ('salon', 'user')
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} dans {self.salon.nom}"

# Bannissements
class Ban(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='bans')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    banned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bans_given')
    reason = models.TextField(blank=True)
    date_ban = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('salon', 'user')
    
    def __str__(self):
        return f"{self.user.username} banni de {self.salon.nom} par {self.banned_by.username}"