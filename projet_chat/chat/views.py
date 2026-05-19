from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_GET, require_POST
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Salon, Channel, Message, SalonRole, Ban
import json


@require_GET
def messages_list(request, slug):
    """Return JSON list of messages for a salon."""
    salon = get_object_or_404(Salon, slug=slug)
    qs = salon.messages.select_related('auteur').order_by('date_envoi')
    data = []
    for m in qs:
        msg_data = {
            'id': m.id,
            'auteur': m.auteur.username,
            'contenu': m.contenu,
            'date_envoi': m.date_envoi.isoformat(),
        }
        if m.fichier:
            msg_data['fichier_url'] = m.fichier.url
            msg_data['fichier_nom'] = m.fichier.name.split('/')[-1]
        data.append(msg_data)
    return JsonResponse({'messages': data})


@require_GET
def channel_messages_list(request, salon_slug, channel_slug):
    """Return JSON list of messages for a channel."""
    salon = get_object_or_404(Salon, slug=salon_slug)
    channel = get_object_or_404(Channel, slug=channel_slug, salon=salon)
    qs = channel.messages.select_related('auteur').order_by('date_envoi')
    data = []
    for m in qs:
        msg_data = {
            'id': m.id,
            'auteur': m.auteur.username,
            'contenu': m.contenu,
            'date_envoi': m.date_envoi.isoformat(),
        }
        if m.fichier:
            msg_data['fichier_url'] = m.fichier.url
            msg_data['fichier_nom'] = m.fichier.name.split('/')[-1]
        data.append(msg_data)
    return JsonResponse({'messages': data})


@require_POST
@login_required
def messages_post(request, slug):
    """Create a new message in the salon. Accepts JSON or form-encoded `contenu` and/or file."""
    salon = get_object_or_404(Salon, slug=slug)

    # Check if user is banned
    if salon.is_banned(request.user):
        return JsonResponse({'error': 'Vous êtes banni de ce salon.'}, status=403)

    contenu = None
    fichier = None

    # Try JSON body first
    try:
        if request.content_type == 'application/json':
            payload = json.loads(request.body.decode() or '{}')
            contenu = payload.get('contenu')
    except Exception:
        contenu = None

    # Fallback to POST form data
    if not contenu:
        contenu = request.POST.get('contenu')

    # Handle file upload
    if 'fichier' in request.FILES:
        fichier = request.FILES['fichier']

    if not contenu and not fichier:
        return HttpResponseBadRequest('Missing contenu or fichier')

    msg = Message.objects.create(salon=salon, auteur=request.user, contenu=contenu or '', fichier=fichier)
    response_data = {
        'id': msg.id,
        'auteur': msg.auteur.username,
        'contenu': msg.contenu,
        'date_envoi': msg.date_envoi.isoformat(),
    }
    if msg.fichier:
        response_data['fichier_url'] = msg.fichier.url
        response_data['fichier_nom'] = msg.fichier.name.split('/')[-1]
    return JsonResponse(response_data)


@require_POST
@login_required
def channel_messages_post(request, salon_slug, channel_slug):
    """Create a new message in the channel. Accepts JSON or form-encoded `contenu` and/or file."""
    salon = get_object_or_404(Salon, slug=salon_slug)
    channel = get_object_or_404(Channel, slug=channel_slug, salon=salon)

    # Check if user is banned
    if salon.is_banned(request.user):
        return JsonResponse({'error': 'Vous êtes banni de ce salon.'}, status=403)

    contenu = None
    fichier = None

    # Try JSON body first
    try:
        if request.content_type == 'application/json':
            payload = json.loads(request.body.decode() or '{}')
            contenu = payload.get('contenu')
    except Exception:
        contenu = None

    # Fallback to POST form data
    if not contenu:
        contenu = request.POST.get('contenu')

    # Handle file upload
    if 'fichier' in request.FILES:
        fichier = request.FILES['fichier']

    if not contenu and not fichier:
        return HttpResponseBadRequest('Missing contenu or fichier')

    msg = Message.objects.create(channel=channel, auteur=request.user, contenu=contenu or '', fichier=fichier)
    response_data = {
        'id': msg.id,
        'auteur': msg.auteur.username,
        'contenu': msg.contenu,
        'date_envoi': msg.date_envoi.isoformat(),
    }
    if msg.fichier:
        response_data['fichier_url'] = msg.fichier.url
        response_data['fichier_nom'] = msg.fichier.name.split('/')[-1]
    return JsonResponse(response_data)


@require_POST
@login_required
def messages_edit(request, message_id):
    """Edit a message. Only the author can edit their message."""
    message = get_object_or_404(Message, id=message_id)
    salon = message.get_chat_entity() if hasattr(message, 'get_chat_entity') else message.salon

    # Check if user is the author
    if message.auteur != request.user:
        return JsonResponse({'error': 'Vous ne pouvez modifier que vos propres messages.'}, status=403)

    # Check if user is banned
    if salon and salon.is_banned(request.user):
        return JsonResponse({'error': 'Vous êtes banni de ce salon.'}, status=403)

    # Get new content
    contenu = None
    try:
        if request.content_type == 'application/json':
            payload = json.loads(request.body.decode() or '{}')
            contenu = payload.get('contenu')
    except Exception:
        contenu = None

    if not contenu:
        contenu = request.POST.get('contenu')

    if not contenu:
        return HttpResponseBadRequest('Missing contenu')

    message.contenu = contenu
    message.save()

    return JsonResponse({
        'id': message.id,
        'auteur': message.auteur.username,
        'contenu': message.contenu,
        'date_envoi': message.date_envoi.isoformat(),
    })


@require_POST
@login_required
def messages_delete(request, message_id):
    """Delete a message. Author or moderators can delete messages."""
    message = get_object_or_404(Message, id=message_id)
    salon = message.get_chat_entity() if hasattr(message, 'get_chat_entity') else message.salon

    # Check if user is the author or a moderator
    if message.auteur != request.user and (not salon or not salon.can_moderate(request.user)):
        return JsonResponse({'error': 'Vous ne pouvez supprimer que vos propres messages ou devez être modérateur.'}, status=403)

    # Check if user is banned
    if salon and salon.is_banned(request.user):
        return JsonResponse({'error': 'Vous êtes banni de ce salon.'}, status=403)

    message.delete()

    return JsonResponse({'success': True})


@require_POST
@login_required
def salon_ban_user(request, salon_slug):
    """Ban a user from a salon. Only admins and moderators can ban users."""
    salon = get_object_or_404(Salon, slug=salon_slug)

    # Check permissions
    if not salon.can_moderate(request.user):
        return JsonResponse({'error': 'Vous devez être modérateur pour bannir des utilisateurs.'}, status=403)

    try:
        payload = json.loads(request.body.decode() or '{}')
        user_id = payload.get('user_id')
        reason = payload.get('reason', '')

        if not user_id:
            return JsonResponse({'error': 'ID utilisateur requis.'}, status=400)

        from django.contrib.auth.models import User
        user_to_ban = get_object_or_404(User, id=user_id)

        # Can't ban yourself
        if user_to_ban == request.user:
            return JsonResponse({'error': 'Vous ne pouvez pas vous bannir vous-même.'}, status=400)

        # Can't ban other admins
        if salon.is_admin(user_to_ban):
            return JsonResponse({'error': 'Vous ne pouvez pas bannir un administrateur.'}, status=400)

        # Create or update ban
        ban, created = Ban.objects.get_or_create(
            salon=salon,
            user=user_to_ban,
            defaults={'banned_by': request.user, 'reason': reason}
        )

        if not created:
            ban.is_active = True
            ban.reason = reason
            ban.banned_by = request.user
            ban.save()

        return JsonResponse({'success': True, 'message': f'{user_to_ban.username} a été banni.'})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_POST
@login_required
def salon_unban_user(request, salon_slug):
    """Unban a user from a salon. Only admins and moderators can unban users."""
    salon = get_object_or_404(Salon, slug=salon_slug)

    # Check permissions
    if not salon.can_moderate(request.user):
        return JsonResponse({'error': 'Vous devez être modérateur pour débannir des utilisateurs.'}, status=403)

    try:
        payload = json.loads(request.body.decode() or '{}')
        user_id = payload.get('user_id')

        if not user_id:
            return JsonResponse({'error': 'ID utilisateur requis.'}, status=400)

        from django.contrib.auth.models import User
        user_to_unban = get_object_or_404(User, id=user_id)

        ban = Ban.objects.filter(salon=salon, user=user_to_unban, is_active=True).first()
        if not ban:
            return JsonResponse({'error': 'Cet utilisateur n\'est pas banni.'}, status=400)

        ban.is_active = False
        ban.save()

        return JsonResponse({'success': True, 'message': f'{user_to_unban.username} a été débanni.'})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_POST
@login_required
def salon_promote_user(request, salon_slug):
    """Promote a user to moderator. Only admins can promote users."""
    salon = get_object_or_404(Salon, slug=salon_slug)

    # Check permissions
    if not salon.can_manage_users(request.user):
        return JsonResponse({'error': 'Vous devez être administrateur pour promouvoir des utilisateurs.'}, status=403)

    try:
        payload = json.loads(request.body.decode() or '{}')
        user_id = payload.get('user_id')
        role = payload.get('role', 'moderator')

        if not user_id:
            return JsonResponse({'error': 'ID utilisateur requis.'}, status=400)

        if role not in ['moderator']:
            return JsonResponse({'error': 'Rôle invalide.'}, status=400)

        from django.contrib.auth.models import User
        user_to_promote = get_object_or_404(User, id=user_id)

        # Can't promote yourself (unless you're the creator)
        if user_to_promote == request.user and request.user != salon.createur:
            return JsonResponse({'error': 'Vous ne pouvez pas vous promouvoir vous-même.'}, status=400)

        # Create or update role
        salon_role, created = SalonRole.objects.get_or_create(
            salon=salon,
            user=user_to_promote,
            defaults={'role': role}
        )

        if not created:
            salon_role.role = role
            salon_role.save()

        return JsonResponse({'success': True, 'message': f'{user_to_promote.username} est maintenant {salon_role.get_role_display()}.'})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_POST
@login_required
def salon_demote_user(request, salon_slug):
    """Demote a user from moderator. Only admins can demote users."""
    salon = get_object_or_404(Salon, slug=salon_slug)

    # Check permissions
    if not salon.can_manage_users(request.user):
        return JsonResponse({'error': 'Vous devez être administrateur pour rétrograder des utilisateurs.'}, status=403)

    try:
        payload = json.loads(request.body.decode() or '{}')
        user_id = payload.get('user_id')

        if not user_id:
            return JsonResponse({'error': 'ID utilisateur requis.'}, status=400)

        from django.contrib.auth.models import User
        user_to_demote = get_object_or_404(User, id=user_id)

        # Can't demote the creator
        if user_to_demote == salon.createur:
            return JsonResponse({'error': 'Vous ne pouvez pas rétrograder le créateur du salon.'}, status=400)

        role = SalonRole.objects.filter(salon=salon, user=user_to_demote).first()
        if not role:
            return JsonResponse({'error': 'Cet utilisateur n\'a pas de rôle spécial.'}, status=400)

        role.delete()

        return JsonResponse({'success': True, 'message': f'{user_to_demote.username} n\'est plus modérateur.'})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_GET
@login_required
def salon_users(request, salon_slug):
    """Get list of users in a salon with their roles and ban status (incl. channels)."""
    salon = get_object_or_404(Salon, slug=salon_slug)

    users = set()

    # toujours inclure le créateur
    users.add(salon.createur)

    # messages directement liés au salon
    for message in salon.messages.select_related("auteur").all():
        users.add(message.auteur)

    # messages des channels du salon (LA CAUSE PRINCIPALE DU BUG)
    for message in Message.objects.filter(channel__salon=salon).select_related("auteur"):
        users.add(message.auteur)

    # rôles (admin/modérateur)
    for role in salon.roles.select_related("user").all():
        users.add(role.user)

    # bannis actifs
    for ban in salon.bans.filter(is_active=True).select_related("user"):
        users.add(ban.user)

    user_data = []
    for user in users:
        role_obj = salon.roles.filter(user=user).first()
        user_data.append({
            "id": user.id,
            "username": user.username,
            "is_admin": salon.is_admin(user),
            "is_moderator": salon.is_moderator(user),
            "is_banned": salon.is_banned(user),
            "role": role_obj.role if role_obj else None,
        })

    return JsonResponse({"users": user_data})
