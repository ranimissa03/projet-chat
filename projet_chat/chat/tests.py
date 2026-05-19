from django.test import TestCase
from django.contrib.auth.models import User
from .models import Salon, Message
from django.urls import reverse
import json


class ModelsTestCase(TestCase):
	def test_salon_and_message_creation(self):
		s = Salon.objects.create(nom='Test', slug='test')
		u = User.objects.create_user(username='alice', password='pass')
		m = Message.objects.create(salon=s, auteur=u, contenu='Bonjour')

		self.assertEqual(str(s), 'Test')
		self.assertIn('Bonjour', str(m))

	def test_messages_api_create_and_list(self):
		# create user and salon
		u = User.objects.create_user(username='bob', password='pass')
		s = Salon.objects.create(nom='Sala', slug='sala')

		# must login to post
		self.client.login(username='bob', password='pass')

		url_post = reverse('api_messages_post', args=[s.slug])
		payload = {'contenu': 'Salut API'}
		resp = self.client.post(url_post, data=json.dumps(payload), content_type='application/json')
		self.assertEqual(resp.status_code, 200)
		data = resp.json()
		self.assertEqual(data['contenu'], 'Salut API')

		# list messages
		url_list = reverse('api_messages_list', args=[s.slug])
		resp2 = self.client.get(url_list)
		self.assertEqual(resp2.status_code, 200)
		listed = resp2.json().get('messages', [])
		self.assertTrue(any(m['contenu'] == 'Salut API' for m in listed))
