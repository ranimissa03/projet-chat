from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User

# Formulaire pour s'inscrire
class RegisterForm(UserCreationForm):
    class Meta:
        model = User
        fields = ("username",) 

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # On ajoute le style Bootstrap aux champs
        self.fields['username'].label = "Nom d'utilisateur"
        self.fields['username'].widget.attrs['class'] = 'form-control'
        self.fields['username'].widget.attrs['placeholder'] = 'ex: etudiant_ensisa'
        self.fields['username'].help_text = "" # On enlève le texte d'aide de base

        # Gestion des mots de passe (champs automatiques de Django)
        if 'password1' in self.fields:
            self.fields['password1'].label = "Mot de passe"
            self.fields['password1'].widget.attrs['class'] = 'form-control'
            self.fields['password1'].help_text = ""

        if 'password2' in self.fields:
            self.fields['password2'].label = "Confirmation"
            self.fields['password2'].widget.attrs['class'] = 'form-control'
            self.fields['password2'].help_text = ""

# Formulaire pour se connecter
class LoginForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Style pour le login
        self.fields['username'].label = "Nom d'utilisateur"
        self.fields['username'].widget.attrs['class'] = 'form-control'
        
        self.fields['password'].label = "Mot de passe"
        self.fields['password'].widget.attrs['class'] = 'form-control'