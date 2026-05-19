from django.contrib import admin

# Register your models here.
from .models import Salon, Channel, Message


@admin.register(Salon)
class SalonAdmin(admin.ModelAdmin):
	list_display = ("nom", "slug")
	search_fields = ("nom", "description")
	prepopulated_fields = {"slug": ("nom",)}


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
	list_display = ("nom", "salon", "slug")
	search_fields = ("nom", "description", "salon__nom")
	list_filter = ("salon",)
	prepopulated_fields = {"slug": ("nom",)}


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
	list_display = ("auteur", "get_chat_entity_name", "short_contenu", "date_envoi")
	search_fields = ("contenu", "auteur__username", "salon__nom", "channel__nom")
	list_filter = ("salon", "channel", "date_envoi")
	raw_id_fields = ("auteur",)
	date_hierarchy = "date_envoi"
	ordering = ("date_envoi",)

	def short_contenu(self, obj):
		if len(obj.contenu) > 75:
			return f"{obj.contenu[:72]}..."
		return obj.contenu
	short_contenu.short_description = "Contenu"
