import { Identifiers } from '@sapphire/framework';
import { oneLine, stripIndent } from 'common-tags';
import { DiscordLogType } from '@/types/database';

export default {
  global: {
    oops: ":warning: Oups... Quelque chose s'est mal passé en réalisant cette action. Il se peut qu'elle ne se soit pas complètement terminée, voire pas commencée. Désolé !",
  },
  errors: {
    precondition: {
      [Identifiers.PreconditionStaffOnly]: ":x: Aïe, tu n'as pas la permission de faire cela :confused:",
      unknownError: "Une pré-condition de commande inconnue vous empêche d'effectuer cette action.",
    },
  },
  miscellaneous: {
    eprofMentionPublic: '{eProf} nous avons besoin de toi !',
    eprofMentionPrivate: '{member} a besoin de toi là-bas : {message.channel}',
    paginatedMessagePrompt: 'À quelle page désires-tu aller ?',
  },
  logs: {
    readableEvents: new Map([
      [DiscordLogType.GuildJoin, ':green_heart: Membre rejoint le serveur'],
      [DiscordLogType.GuildLeave, ':broken_heart: Membre quitte le serveur'],
      [DiscordLogType.MessageEdit, ':incoming_envelope: Message modifié'],
      [DiscordLogType.MessagePost, ':envelope_with_arrow: Message posté'],
      [DiscordLogType.MessageRemove, ':wastebasket:Message supprimé'],
      [DiscordLogType.ReactionAdd, ':smiley: Réaction ajoutée'],
      [DiscordLogType.ReactionRemove, ':anguished: Réaction supprimée'],
      [DiscordLogType.Rename, ':label: Changement de pseudo'],
      [DiscordLogType.RoleAdd, ':beginner: Rôle ajouté'],
      [DiscordLogType.RoleRemove, ':octagonal_sign: Rôle enlevé'],
      [DiscordLogType.VoiceJoin, ':loud_sound: Connection en vocal'],
      [DiscordLogType.VoiceLeave, ":mute: Déconnexion d'un vocal"],
    ]),
    embedTitle: 'Logs automatiques',
    fields: {
      [DiscordLogType.GuildJoin]: {
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ":link: Lien d'invitation",
        contentValue: '`{code}`: lien créé par {link.inviter}, utilisé {link.uses} fois.',
      },
      [DiscordLogType.GuildLeave]: {
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ":file_folder: Récap' des informations",
        contentValue: stripIndent`
          Pseudo : "{content.username}" / Surnom : "{content.displayName}" (ID: \`{content.userId}\`)
          À rejoint : <t:{content.joinedAt}:R>
          Rôles : {content.roles}
        `,
      },
      [DiscordLogType.MessageEdit]: {
        contextName: '',
        contextValue: '',
        contentName: '',
        contentValue: '',
      },
      [DiscordLogType.MessagePost]: {
        contextName: '',
        contextValue: '',
        contentName: '',
        contentValue: '',
      },
      [DiscordLogType.MessageRemove]: {
        contextName: '',
        contextValue: '',
        contentName: '',
        contentValue: '',
      },
      [DiscordLogType.ReactionAdd]: {
        contextName: '',
        contextValue: '',
        contentName: '',
        contentValue: '',
      },
      [DiscordLogType.ReactionRemove]: {
        contextName: '',
        contextValue: '',
        contentName: '',
        contentValue: '',
      },
      [DiscordLogType.Rename]: {
        contextName: '',
        contextValue: '',
        contentName: '',
        contentValue: '',
      },
      [DiscordLogType.RoleAdd]: {
        contextName: ':busts_in_silhouette: Membres',
        contextValue: 'Cible : <@{context.userId}>\nExécuteur : <@{context.executorId}>',
        contentName: ':billed_cap: Rôle ajouté',
        contentValue: '{content}',
      },
      [DiscordLogType.RoleRemove]: {
        contextName: ':busts_in_silhouette: Membres',
        contextValue: 'Cible : <@{context.userId}>\nExécuteur : <@{context.executorId}>',
        contentName: ':billed_cap: Rôle enlevé',
        contentValue: '{content}',
      },
      [DiscordLogType.VoiceJoin]: {
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ':sound: Salon',
        contentValue: '<#{content}>',
      },
      [DiscordLogType.VoiceLeave]: {
        contextName: ':bust_in_silhouette: Membre',
        contextValue: '<@{context}>',
        contentName: ':sound: Salon',
        contentValue: '<#{content}>',
      },
    },
  },
  reminders: {
    alarm: ":alarm_clock: Il est l'heure ! Tu m'avais demandé de te rappeler ceci :\n> {description}",
    noDescription: 'Aucune description',
  },
  upcomingClasses: {
    header: '__Calendrier des séances de révisions des 7 prochains jours__\n*Il est tenu à jour automatiquement, pensez à le regarder régulièrement !*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n',
    noClasses: 'Aucune séance de prévue !',
    classLine: '• {beginHour}h-{endHour}h: {eclass.topic} <#{eclass.subject.textChannel}> (par <@{eclass.professor}>) [<@&{eclass.targetRole}>]\n',
  },
  classesCalendar: {
    title: "Calendrier des cours sur Ef'Réussite",
    noClasses: 'Aucun cours prévu pour le moment.',
    subjectTitle: '{emoji} {name}',
    textChannel: 'Salon textuel : <#{textChannel}>',
    textDocsChannel: ' • Documents : <#{textDocsChannel}>',
    body: '{exams}\n\n**Cours à venir :**\n{classes}\n**\n**',
    classLine: '• <t:{date}:R> - {beginHour}-{endHour} (<@{professor}>) : {topic}',
  },
  antiSwear: {
    swearModAlert: stripIndent`
      {message.member} a dit "{swear}" dans {message.channel} et j'ai detecté cela comme une insulte. Si ce message est inapproprié, réagissez avec :white_check_mark: à ce message pour le flagger.

      {message.url}
    `,
    manualSwearAlert: stripIndent`
      {message.member} à envoyé un message jugé innaproprié par {manualModerator} dans {message.channel}. Il/elle a donc été sommé(e) en MP.

      {message.url}
    `,
    swearModAlertUpdate: stripIndent`
      *~~{message.member} à dit "{swear}" dans {message.channel} et j'ai detecté cela comme une insulte.~~*
      {moderator} a flaggé ce message et l'utilisateur a été sommé en MP.

      {message.url}
    `,
    swearUserAlert: oneLine`
      Bonjour {message.member}, je suis le bot du Discord de révision Ef'Réussite. Tu as tenu un propos innaproprié
      ("{swear}") dans {message.channel}. On s'efforce à garder ce serveur sérieux et amical, nous t'invitons donc à
      supprimer ce message ou enlever cette insulte le plus rapidement possible. Merci !\n{message.url}
    `,
    swearUserAlertPublic: oneLine`
      Bonjour {message.member}. Tu as tenu un propos innaproprié ("{swear}") dans ce salon. On s'efforce à garder ce
      serveur sérieux et amical, nous t'invitons donc à supprimer ce message ou enlever cette insulte le plus rapidement
      possible. Merci !\n{message.url}
    `,
    swearManualUserAlert: oneLine`
      Bonjour {message.member}, je suis le bot du discord de révision Ef'Réussite. Tu as tenu un propos innaproprié
      dans {message.channel}. On s'efforce à garder ce serveur sérieux et amical, nous t'invitons donc à supprimer
      ce message ou enlever cette insulte le plus rapidement possible. Merci !\n{message.url}
    `,
    swearManualUserAlertPublic: oneLine`
      Bonjour {message.member}. Tu as tenu un propos innaproprié dans ce salon. On s'efforce à garder ce serveur
      sérieux et amical, nous t'invitons donc à supprimer ce message ou enlever cette insulte le plus rapidement possible.
      Merci !\n{message.url}
    `,
  },
  prompts: {
    channel: {
      base: 'Entre un salon (mentionne-le ou entre son nom ou son ID) :',
      invalid: 'Ce salon est invalide.',
    },
    message: {
      base: 'Entre un message (son ID ou son URL) :',
      invalid: 'Ce message est invalide.',
    },
    text: {
      base: 'Entre du texte :',
      invalid: 'Ce texte est invalide.',
    },
    day: {
      base: 'Entre une date (au format "jj/MM")  :',
      invalid: 'Cette date est invalide.',
    },
    hour: {
      base: 'Entre une heure (au format "HH:mm") :',
      invalid: 'Cette heure est invalide.',
    },
    date: {
      base: 'Entre une date (au format "jj/MM HH:mm")  :',
      invalid: 'Cette date est invalide.',
    },
    duration: {
      base: 'Entre une durée (en anglais ou en francais).\nTu pouvez par exemple entrer `30min` pour 30 minutes et `2h` pour 2 heures. Tu peux également combiner ces durées ensemble : `2h30min` est par exemple une durée valide.',
      invalid: 'Cette durée est invalide.',
    },
    member: {
      base: 'Entre un membre (mentionne-le ou entre son pseudo ou son ID) :',
      invalid: 'Ce membre est invalide.',
    },
    role: {
      base: 'Entre un rôle (mentionne-le ou entre son nom ou son ID) :',
      invalid: 'Ce rôle est invalide.',
    },
    boolean: {
      base: 'Entre un booléen ("oui"/"non") :',
      invalid: 'Ce booléan est invalide.',
    },

    stoppedPrompting: 'Tu as bien abandonné la commande !',
  },
};
