<h1 align="center">MonkaBot</h1>
<p align="center">
    🦉 Le bot du discord Ef'Réussite !
</p>

## Rapport de bug et suggestions

- Vous avez aperçu un bug en utilisant MonkaBot ?
- Vous avez une idée ou une suggestion ?
- Vous souhaitez nous faire part de quelque chose ?

Vous pouvez vous rendre dans le [menu des issues] et en créer une ; nous y jetterons un œil dès que possible !\
Pour tout autre question, vous pouvez créer une [Discussion GitHub].

## Développement et contributions

Nos Pull Request (PR) sont ouvertes à toutes contributions ! Vous pouvez regarder notre [guide de contributions] avant de commencer à travailler sur MonkaBot : il vous aidera à tout mettre en place et à vous assurer que votre PR puisse être merge rapidement.

## Informations

MonkaBot est un bot Discord développé en TypeScript (un dérivé de JavaScript avec un typage plus fort). Il utilise la librairie [discord.js] pour les appels à l'API Discord.
Il utilise également le framework [Sapphire], par-dessus discord.js. Ce framework sert notamment à gérer les évènements, les commandes et les arguments...

Vous pouvez utiliser le bot pour votre propre serveur à condition de respecter la [License] (MIT).

## Organisation du projet

- **`dist`** *(pas sur GitHub)* **:** Dossier où se trouve le code transpilé de MonkaBot, après avoir lancé `npm run build` (ou `npm start`).
- **`config` :** Dossier où se trouvent tous les fichiers de configuration de MonkaBot.
- **`src` :**
  - **`arguments` :** Dossier où se trouvent tous les arguments customs.
  - **`commands` :** Dossier où se trouvent toutes les commandes, rangées dans des sous-dossiers correspondant à leurs catégories.
  - **`listeners` :** Dossier où se trouvent tous les gestionnaires d'évènement.
  - **`lib` :** Dossier contenant plusieurs fichiers utiles dans le code.
    - **`models` :** Fichiers des schemas mongoose.
    - **`structures` :** Différentes classes utilisées à travers MonkaBot.
    - **`types` :** Fichiers contenant les typings TypeScript nécessaires pour MonkaBot.
    - **`utils` :** Dossier contenant différentes fonctions utilitaires.

## Crédits

#### Développeurs

- [noftaly] (noftaly#0359)

#### Contributeurs

*Aucun pour le moment, mais je veux bien un [petit coup de main] 🙂*

#### License

MonkaBot est sous license [MIT](./LICENSE).

<!-- Link Dump -->

[menu des issues]: https://github.com/EFREI-Horizon/MonkaBot/issues
[Discussion GitHub]: https://github.com/EFREI-Horizon/MonkaBot/discussions
[guide de contributions]: ./CONTRIBUTING.md
[discord.js]: https://npmjs.com/package/discord.js
[Sapphire]: https://www.npmjs.com/package/@sapphire/framework
[License]: https://github.com/EFREI-Horizon/MonkaBot/blob/master/LICENSE
[noftaly]: https://github.com/noftaly
[petit coup de main]: #-développement-et-contributions
[MIT]: ./LICENSE
