# Fil d'actu - Widget

Dépôt GitHub : **https://github.com/Les-Doubles-A/fil-actu-widget**

Extension navigateur : widget d'actualités (Reuters, AP, AFP, BBC, France 24) construit par analyse des pages, sans RSS.

<!-- installeur-release -->
## Installation

Téléchargez **`fil-actu-widget-Setup-1.0.1.exe`** depuis la [dernière release](https://github.com/Les-Doubles-A/fil-actu-widget/releases/latest), puis lancez-le.

L'installeur copie l'extension dans `%LOCALAPPDATA%\Programs\fil-actu-widget\extension` puis affiche la marche à suivre :

1. Ouvrez la page des extensions du navigateur (`chrome://extensions`, `edge://extensions`, `vivaldi://extensions`...).
2. Activez le **Mode développeur**.
3. Cliquez sur **Charger l'extension non empaquetée** et choisissez le dossier `extension` (raccourci dans le menu Démarrer).

L'installeur n'est pas signé : si Windows SmartScreen l'affiche, cliquez sur « Informations complémentaires » puis « Exécuter quand même ».

### Recréer l'installeur

Lancer [Inno Setup 6](https://jrsoftware.org/isinfo.php) : `iscc installer\fil-actu-widget.iss`. Le setup est créé dans `installer\Output\`.
