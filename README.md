# Chatbot URIKA CLOUD

> Assistant virtuel intelligent permettant aux visiteurs de découvrir les services proposés par URIKA CLOUD et d’obtenir des réponses claires.

## À propos

Le projet consiste à développer un chatbot destiné au site web d’URIKA CLOUD.

Le visiteur peut poser une question concernant les services de l’entreprise.  
L’interface JavaScript envoie la question à un backend FastAPI, qui transmet ensuite la demande à l’API OpenAI.

Le chatbot utilise uniquement les informations présentes dans le fichier `backend/services.txt`.

Il ne doit jamais inventer :

- un service ;
- un prix ;
- un délai ;
- une information non validée par l’entreprise.

Les conversations ne sont pas enregistrées de manière permanente.

## Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Services couverts](#services-couverts)
- [Technologies](#technologies)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement du projet](#lancement-du-projet)
- [Utilisation](#utilisation)
- [Référence API](#référence-api)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Auteur](#auteur)

## Aperçu

<p align="center">
  <img
    src="assets/chatbot-page.png"
    alt="Page de présentation du chatbot URIKA CLOUD"
    width="1000"
  >
</p>

<p align="center">
  <img
    src="assets/chatbot-open.png"
    alt="Fenêtre du chatbot URIKA CLOUD"
    width="500"
  >
</p>

## Fonctionnalités

- Interface de chatbot flottante.
- Ouverture et fermeture avec animation.
- Interface responsive pour ordinateur, tablette et téléphone.
- Questions suggérées pour faciliter la navigation.
- Envoi d’un message avec le bouton ou la touche `Entrée`.
- Utilisation de `Maj + Entrée` pour ajouter une nouvelle ligne.
- Animation pendant la préparation de la réponse.
- Appel sécurisé du backend FastAPI.
- Connexion du backend à l’API OpenAI.
- Réponses générées à partir des services officiels d’URIKA CLOUD.
- Limitation des messages à 800 caractères.
- Gestion des erreurs réseau et serveur.
- Réponses en français.
- Aucune clé API placée dans le frontend.
- Aucune conservation permanente des conversations.

## Services couverts

Le chatbot peut répondre aux questions concernant les services suivants :

1. Création de sites web et d’applications mobiles.
2. Création de plateformes e-commerce, marketplace et e-learning.
3. Marketing digital, community management et référencement SEO.
4. Solutions ERP, CRM, codes-barres et QR codes.
5. Maintenance informatique matérielle et logicielle.
6. Infogérance.
7. Installation et maintenance des réseaux informatiques.
8. Installation et maintenance des caméras de vidéosurveillance.
9. Formations.

## Technologies

| Couche | Technologie |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Icônes | Font Awesome |
| Backend | Python, FastAPI |
| Serveur local | Uvicorn |
| Validation | Pydantic |
| Variables d’environnement | python-dotenv |
| Intelligence artificielle | API OpenAI |
| Format des données | JSON |
| Versionnement | Git et GitHub |

## Structure du projet

```text
URIKA-CHATBOT/
├── assets/
│   ├── chatbot-page.png
│   └── chatbot-open.png
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── main.py
│   ├── services.txt
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   └── .venv/
│
├── .gitignore
└── README.md
```

Les éléments suivants ne doivent pas être publiés :

```text
backend/.env
backend/.venv/
backend/__pycache__/
*.pyc
```

## Prérequis

- Python installé sur l’ordinateur.
- Python 3.10 ou une version plus récente recommandée.
- Une connexion Internet.
- Une clé API OpenAI valide.
- Un modèle OpenAI accessible avec cette clé.
- Visual Studio Code ou un autre éditeur.
- Un navigateur récent.
- Git et GitHub Desktop pour le versionnement.

## Installation

### 1. Cloner le dépôt

```bash
git clone URL_DU_DEPOT
cd urika-chatbot
```

Pour un projet déjà présent sur l’ordinateur, ouvrir directement le dossier dans Visual Studio Code.

### 2. Accéder au backend

Sous PowerShell :

```powershell
cd backend
```

### 3. Créer l’environnement virtuel

```powershell
py -m venv .venv
```

### 4. Installer les dépendances

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Le fichier `backend/requirements.txt` contient :

```text
fastapi
uvicorn[standard]
openai
python-dotenv
pydantic
```

## Configuration

### Variables d’environnement

Créer un fichier :

```text
backend/.env
```

Ajouter :

```env
OPENAI_API_KEY=VOTRE_CLE_OPENAI
OPENAI_MODEL=NOM_DU_MODELE_AUTORISE
```

Exemple de structure uniquement :

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
OPENAI_MODEL=nom-du-modele
```

Ne jamais utiliser une fausse valeur comme :

```env
OPENAI_API_KEY=COLLE_TA_CLE_ICI
```

### Fichier `.env.example`

Le fichier publié dans GitHub doit contenir uniquement :

```env
OPENAI_API_KEY=
OPENAI_MODEL=
```

Il ne doit contenir aucun secret.

### Configuration CORS

Pendant le développement, le backend autorise :

```text
http://127.0.0.1:5500
http://localhost:5500
```

En production, il doit autoriser les domaines validés par l’entreprise, par exemple :

```text
https://urikacloud.com
https://www.urikacloud.com
```

## Lancement du projet

Le projet utilise deux serveurs locaux :

```text
Backend  → port 8000
Frontend → port 5500
```

### Lancer le backend

Depuis le dossier `backend` :

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Résultat attendu :

```text
Uvicorn running on http://127.0.0.1:8000
Application startup complete.
```

Laisser ce terminal ouvert.

### Vérifier le backend

Ouvrir dans le navigateur :

```text
http://127.0.0.1:8000/health
```

Résultat attendu :

```json
{
  "status": "ok",
  "service": "URIKA CLOUD chatbot"
}
```

### Ouvrir la documentation FastAPI

```text
http://127.0.0.1:8000/docs
```

### Lancer le frontend

Ouvrir un deuxième terminal à la racine du projet :

```powershell
cd frontend
py -m http.server 5500
```

Puis ouvrir dans le navigateur :

```text
http://127.0.0.1:5500
```

## Utilisation

1. Ouvrir la page du chatbot.
2. Cliquer sur le bouton flottant en bas à droite.
3. Écrire une question.
4. Cliquer sur l’icône d’envoi ou appuyer sur `Entrée`.
5. Attendre la réponse de l’assistant.
6. Utiliser les questions suggérées si nécessaire.

Exemples :

```text
Quels services propose URIKA CLOUD ?
```

```text
Pouvez-vous créer un site web pour mon entreprise ?
```

```text
Proposez-vous des formations ?
```

```text
Installez-vous des caméras de vidéosurveillance ?
```

## Référence API

Toutes les réponses du backend utilisent le format JSON.

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Retourne les informations générales du service |
| GET | `/health` | Vérifie que le backend fonctionne |
| POST | `/chat` | Envoie une question au chatbot |

### `GET /`

Exemple de réponse :

```json
{
  "service": "Chatbot URIKA CLOUD",
  "status": "running"
}
```

### `GET /health`

Exemple de réponse :

```json
{
  "status": "ok",
  "service": "URIKA CLOUD chatbot"
}
```

### `POST /chat`

Corps de la requête :

```json
{
  "message": "Quels services propose URIKA CLOUD ?"
}
```

Réponse réussie :

```json
{
  "status": "success",
  "answer": "URIKA CLOUD propose plusieurs services..."
}
```

Le champ `message` doit contenir entre 1 et 800 caractères.

## Tests

### Questions relatives aux services

```text
Pouvez-vous créer une application mobile ?
```

```text
Je souhaite ouvrir une boutique en ligne.
```

```text
Pouvez-vous gérer les réseaux sociaux de mon entreprise ?
```

```text
Je cherche une solution CRM.
```

```text
Mon ordinateur professionnel est en panne.
```

```text
Pouvez-vous installer un réseau informatique ?
```

### Prix

Question :

```text
Combien coûte un site web ?
```

Comportement attendu :

- ne pas inventer de montant ;
- expliquer que le prix dépend des besoins ;
- proposer une demande de devis.

### Délais

Question :

```text
Combien de temps faut-il pour créer une application ?
```

Comportement attendu :

- ne pas inventer de délai ;
- expliquer qu’une étude du besoin est nécessaire.

### Question hors sujet

Question :

```text
Donne-moi une recette de pizza.
```

Comportement attendu :

- recentrer poliment la conversation sur URIKA CLOUD.

### Information inconnue

Question :

```text
Quels sont vos horaires exacts ?
```

Comportement attendu :

- ne pas inventer les horaires ;
- indiquer que l’information n’est pas disponible.

## Déploiement

L’adresse prévue pour le backend hébergé est :

```text
https://ais.urikacloud.com
```

Pendant le développement local, le fichier `frontend/index.html` contient :

```html
<script
  src="script.js"
  data-api-url="http://127.0.0.1:8000"
></script>
```

Après l’hébergement et après validation de :

```text
https://ais.urikacloud.com/health
```

remplacer l’adresse locale par :

```html
<script
  src="script.js"
  data-api-url="https://ais.urikacloud.com"
></script>
```

Le frontend appellera alors :

```text
https://ais.urikacloud.com/chat
```

### Configuration du serveur

Sur le serveur, l’administrateur doit configurer :

```env
OPENAI_API_KEY=VALEUR_SECRETE
OPENAI_MODEL=NOM_DU_MODELE
```

Puis installer les dépendances :

```bash
pip install -r requirements.txt
```

Exemple de commande de lancement :

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Le serveur devra également configurer :

- le nom de domaine ;
- HTTPS ;
- le proxy inverse ;
- les variables d’environnement ;
- les origines CORS ;
- le redémarrage automatique du backend.

## Auteur

Projet réalisé dans le cadre du développement d’un chatbot intelligent pour URIKA CLOUD.