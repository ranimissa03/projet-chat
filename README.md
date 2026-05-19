# 💬 Application Chat — Django

Projet académique réalisé à l'**ENSISA** (Groupe INSA) par **Ranim Ben Issa**, **Diouf** et **François Battaglia**.

Application web de messagerie en temps réel avec gestion de salons, channels, rôles et bannissements.

---

## ✨ Fonctionnalités

- 🏠 **Salons** — création, suppression, gestion par le créateur
- 📢 **Channels** — plusieurs canaux de discussion par salon
- 💬 **Messages en temps réel** — envoi de texte et de fichiers
- 👤 **Authentification** — inscription, connexion, déconnexion
- 🛡️ **Rôles** — administrateur, modérateur, membre
- 🚫 **Bannissements** — les admins peuvent bannir des utilisateurs
- 📁 **Partage de fichiers** — envoi de fichiers dans les messages
- 🔌 **API REST** — endpoints JSON pour les messages

---

## 🛠️ Technologies

| Technologie | Usage |
|---|---|
| Python / Django 6.0 | Backend & logique métier |
| Django Templates | Interface HTML |
| JavaScript | Interactions temps réel |
| CSS | Style de l'interface |
| SQLite | Base de données |
| Gunicorn + Whitenoise | Déploiement production |
| Pillow | Gestion des images |

---

## 🚀 Installation & Lancement

### Prérequis
- Python 3.10+

### Étapes

```bash
git clone https://github.com/ranimissa03/projet-chat.git
cd projet-chat
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Accès : [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 📁 Structure du projet
projet_chat/

├── chat/               # Application principale

├── config/             # Configuration Django

├── requirements.txt 

└── manage.py

---

## 👥 Auteurs

- **Ranim Ben Issa** — [ranimissa03](https://github.com/ranimissa03)
- **Diouf**
- **François Battaglia**
