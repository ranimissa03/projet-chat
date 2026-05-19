from django.urls import path
from . import views_pages, views_api, views

urlpatterns = [
    # Pages du site
    path('', views_pages.index, name='index'),

    # Salon creation must come before the slug route so 'creer' isn't captured as a slug
    path('salon/creer/', views_pages.creer_salon, name='salon_create'),
    path('salon/<slug:slug>/supprimer/', views_pages.supprimer_salon, name='salon_delete'),

    path('salon/<slug:slug>/', views_pages.room, name='room'),
    path('salon/<slug:salon_slug>/creer-canal/', views_pages.creer_channel, name='channel_create'),
    path('salon/<slug:salon_slug>/<slug:channel_slug>/', views_pages.channel, name='channel'),
    path('salon/<slug:salon_slug>/<slug:channel_slug>/supprimer/', views_pages.supprimer_channel, name='channel_delete'),

    # Auth (tes routes)
    path('inscription/', views_pages.inscription, name='register'),
    path('connexion/', views_pages.connexion, name='login'),
    path('deconnexion/', views_pages.deconnexion, name='logout'),

    #Compat Django : évite le 404 sur /accounts/login/ quand login_required redirige
    path('accounts/login/', views_pages.connexion, name='accounts_login'),
    path('accounts/logout/', views_pages.deconnexion, name='accounts_logout'),

    # API (Partie AJAX)
    path('api/exemple/', views_api.api_exemple, name='api_exemple'),

    # Messages API for the salon
    path('api/salon/<slug:slug>/messages/', views.messages_list, name='api_messages_list'),
    path('api/salon/<slug:slug>/messages/send/', views.messages_post, name='api_messages_post'),

    # Messages API for channels
    path('api/salon/<slug:salon_slug>/<slug:channel_slug>/messages/', views.channel_messages_list, name='api_channel_messages_list'),
    path('api/salon/<slug:salon_slug>/<slug:channel_slug>/messages/send/', views.channel_messages_post, name='api_channel_messages_post'),

    path('api/messages/<int:message_id>/edit/', views.messages_edit, name='api_messages_edit'),
    path('api/messages/<int:message_id>/delete/', views.messages_delete, name='api_messages_delete'),

    # Moderation API
    path('api/salon/<slug:salon_slug>/ban/', views.salon_ban_user, name='api_salon_ban'),
    path('api/salon/<slug:salon_slug>/unban/', views.salon_unban_user, name='api_salon_unban'),
    path('api/salon/<slug:salon_slug>/promote/', views.salon_promote_user, name='api_salon_promote'),
    path('api/salon/<slug:salon_slug>/demote/', views.salon_demote_user, name='api_salon_demote'),
    path('api/salon/<slug:salon_slug>/users/', views.salon_users, name='api_salon_users'),
]
