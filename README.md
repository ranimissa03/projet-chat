# projet-chat💬 Application Chat — Django
Projet académique réalisé à l'ENSISA (Groupe INSA) par Ranim Ben Issa, Diouf et François Battaglia.
Application web de messagerie en temps réel avec gestion de salons, channels, rôles et bannissements.

✨ Fonctionnalités

🏠 Salons — création, suppression, gestion par le créateur

📢 Channels — plusieurs canaux de discussion par salon

💬 Messages en temps réel — envoi de texte et de fichiers

👤 Authentification — inscription, connexion, déconnexion

🛡️ Rôles — administrateur, modérateur, membre
🚫 Bannissements — les admins peuvent bannir des utilisateurs
📁 Partage de fichiers — envoi de fichiers dans les messages
🔌 API REST — endpoints JSON pour les messages


🛠️ Technologies
TechnologieUsagePython / Django 6.0Backend & logique métierDjango TemplatesInterface HTMLJavaScriptInteractions temps réelCSSStyle de l'interfaceSQLiteBase de donnéesGunicorn + WhitenoiseDéploiement productionPillowGestion des images

🚀 Installation & Lancement
Prérequis

Python 3.10+

Étapes
bash# 1. Cloner le dépôt
git clone https://github.com/ranimissa03/projet-chat.git
cd projet-chat

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Appliquer les migrations
python manage.py migrate

# 4. Créer un superutilisateur (optionnel)
python manage.py createsuperuser

# 5. Lancer le serveur
python manage.py runserver
Accès : http://127.0.0.1:8000

📁 Structure du projet
projet_chat/
├── chat/               # Application principale
│   ├── models.py       # Salon, Channel, Message, SalonRole, Ban
│   ├── views.py        # Vues principales
│   ├── views_api.py    # API REST (JSON)
│   ├── views_pages.py  # Vues des pages
│   ├── urls.py         # Routes
│   ├── templates/      # HTML
│   └── static/         # CSS & JS
├── config/             # Configuration Django
├── requirements.txt
└── manage.py
