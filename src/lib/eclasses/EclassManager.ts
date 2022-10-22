import { EmbedLimits, RoleLimits } from '@sapphire/discord-utilities';
import { container, Option, Result } from '@sapphire/framework';
import dayjs from 'dayjs';
import type {
  CommandInteraction,
  GuildMember,
  GuildTextBasedChannel,
  ModalSubmitInteraction,
} from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { eclass as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import * as EclassMessagesManager from '@/eclasses/EclassMessagesManager';
import Eclass from '@/models/eclass';
import type { EclassCreationOptions, EclassEmbedOptions } from '@/types';
import { SchoolYear } from '@/types';
import type { EclassPopulatedDocument } from '@/types/database';
import {
  ConfigEntriesChannels,
  ConfigEntriesRoles,
  EclassPlace,
  EclassStatus,
} from '@/types/database';
import {
  massSend,
  noop,
  nullop,
  trimText,
} from '@/utils';

const classAnnouncement: Record<SchoolYear, ConfigEntriesChannels> = {
  [SchoolYear.L1]: ConfigEntriesChannels.ClassAnnouncementL1,
  [SchoolYear.L2]: ConfigEntriesChannels.ClassAnnouncementL2,
  [SchoolYear.L3]: ConfigEntriesChannels.ClassAnnouncementL3,
};

const schoolYearRoles: Record<SchoolYear, ConfigEntriesRoles> = {
  [SchoolYear.L1]: ConfigEntriesRoles.SchoolYearL1,
  [SchoolYear.L2]: ConfigEntriesRoles.SchoolYearL2,
  [SchoolYear.L3]: ConfigEntriesRoles.SchoolYearL3,
};

export function createAnnouncementEmbed({
  classChannel,
  classId,
  date,
  duration,
  end,
  isRecorded,
  professor,
  subject,
  topic,
  place,
  placeInformation,
}: EclassEmbedOptions): MessageEmbed {
  const texts = config.messages.newClassEmbed;
  const embed = new MessageEmbed()
    .setColor(settings.colors.green)
    .setTitle(pupa(texts.title, { subject, topic }))
    .setDescription(pupa(texts.description, { subject, classChannel, date }))
    .setThumbnail(subject.emojiImage)
    .setAuthor({ name: texts.author })
    .addFields([
      { name: texts.date, value: pupa(texts.dateValue, { date, end }), inline: true },
      { name: texts.duration, value: dayjs.duration(duration).humanize(), inline: true },
      { name: texts.professor, value: professor.toString(), inline: true },
      { name: texts.recorded, value: config.messages.recordedValues[Number(isRecorded)], inline: true },
      { name: texts.place, value: pupa(texts.placeValues[place], { place, placeInformation, subject }), inline: true },
    ])
    .setFooter({ text: pupa(texts.footer, { classId }) });

  if (classChannel.guild.iconURL())
    embed.setAuthor({ name: texts.author, iconURL: classChannel.guild.iconURL()! });

  return embed;
}

export function getRoleNameForClass(
  { formattedDate, subject, topic }: Pick<EclassPopulatedDocument, 'subject' | 'topic'> & { formattedDate: string },
): string {
  const baseRoleName = pupa(settings.configuration.eclassRoleFormat, { subject, topic: '{topic}', formattedDate });
  const remainingLength = RoleLimits.MaximumNameLength - baseRoleName.length + '{topic}'.length;
  return pupa(baseRoleName, { topic: trimText(topic, remainingLength) });
}

export async function createClass(
  interaction: CommandInteraction<'cached'> | ModalSubmitInteraction<'cached'>,
  {
    date, subject, topic, duration, professor, isRecorded, targetRole, place, placeInformation,
  }: EclassCreationOptions,
): Promise<Result<EclassPopulatedDocument, string>> {
  // Prepare the date
  const formattedDate = dayjs(date).format(settings.configuration.dateFormat);

  targetRole ??= await container.client.configManager.get(schoolYearRoles[subject.schoolYear], interaction.guildId);
  if (!targetRole) {
    container.logger.warn('[e-class:not-created] A new e-class was planned but no school year role found, unable to create.');
    return Result.err(config.messages.unconfiguredRole);
  }

  const roleName = getRoleNameForClass({ formattedDate, subject, topic });
  if (interaction.guild.roles.cache.some(r => r.name === roleName))
    return Result.err(config.messages.alreadyExists);

  // Get the corresponding channels
  const announcementChannel = await container.client.configManager
    .get(classAnnouncement[subject.schoolYear], interaction.guild.id);
  if (!announcementChannel) {
    container.logger.warn('[e-class:not-created] A new e-class was planned but no announcement channel was found, unable to create.');
    return Result.err(config.messages.unconfiguredChannel);
  }

  const classChannel = await interaction.guild.channels.fetch(subject.textChannelId) as GuildTextBasedChannel;

  // Create & send the announcement embed
  const embed = createAnnouncementEmbed({
    classChannel,
    classId: 'Création en cours...',
    date: Math.floor(date.getTime() / 1000),
    duration,
    end: Math.floor((date.getTime() + duration) / 1000),
    isRecorded,
    professor,
    subject,
    topic,
    place,
    placeInformation,
  });

  const newClassNotificationPlaceAlert = place === EclassPlace.Discord
    ? ''
    : pupa(config.messages.newClassNotificationPlaceAlert, {
        where: config.messages.where({ place, placeInformation, subject }),
      });

  const announcementMessage = await announcementChannel.send({
    content: pupa(config.messages.newClassNotification, {
      targetRole,
      newClassNotificationPlaceAlert,
    }),
    embeds: [embed],
  });

  // Add the reaction & cache the message
  await announcementMessage.react(settings.emojis.yes);
  if (announcementMessage.crosspostable)
    await announcementMessage.crosspost();
  container.client.eclassRolesIds.add(announcementMessage.id);

  // Create the role
  const role = await interaction.guild.roles.create({
    name: roleName,
    color: settings.colors.white,
    mentionable: true,
  });

  // Add the class to the database
  const classId = Eclass.generateId(professor, date);
  const eclass = await Eclass.create({
    classChannel: classChannel.id,
    guild: classChannel.guild.id,
    topic,
    subject,
    date: date.getTime(),
    duration,
    professor: professor.id,
    classRole: role.id,
    targetRole: targetRole.id,
    place,
    placeInformation,
    announcementMessage: announcementMessage.id,
    announcementChannel: classAnnouncement[subject.schoolYear],
    classId,
    isRecorded,
  });
  // Use the newly created ID in the embed
  await announcementMessage.edit({
    content: announcementMessage.content,
    embeds: [embed.setFooter({ text: pupa(config.messages.newClassEmbed.footer, eclass) })],
  });

  // Edit the global week-upcoming-classes announcement messages
  await EclassMessagesManager.updateUpcomingClassesForGuild(eclass.guildId);

  container.logger.debug(`[e-class:${classId}] Created eclass.`);
  return Result.ok(eclass);
}

export async function startClass(eclass: EclassPopulatedDocument): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager.get(eclass.announcementChannelId, eclass.guildId);
  if (!announcementChannel)
    throw new Error(`Could not find [eclass:${eclass.classId} announcement's channel (${eclass.announcementChannelId}).`);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessageId);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  announcementEmbed.setColor(settings.colors.orange);
  const dateField = announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.date);
  if (dateField) {
    dateField.value = pupa(config.messages.newClassEmbed.dateValueInProgress, eclass.normalizeDates());
  } else {
    announcementEmbed.addFields({
      name: config.messages.newClassEmbed.date,
      value: pupa(config.messages.newClassEmbed.dateValueInProgress, eclass.normalizeDates()),
      inline: true,
    });
  }
  await announcementMessage.edit({ embeds: [announcementEmbed] });
  await announcementMessage.reactions.removeAll();

  // Send an embed in the corresponding text channel
  const classChannel = container.client
    .guilds.resolve(eclass.guildId)
    ?.channels.resolve(eclass.subject.textChannelId) as GuildTextBasedChannel | undefined;

  const texts = config.messages.startClassEmbed;
  // @ts-expect-error: setAuthor will work as expected if we pass it a nullish value
  const embed = new MessageEmbed()
    .setColor(settings.colors.primary)
    .setTitle(pupa(texts.title, { eclass }))
    .setAuthor({ name: texts.author, iconURL: announcementChannel.guild.iconURL() })
    .setDescription(pupa(texts.baseDescription, {
      eclass,
      isRecorded: eclass.isRecorded ? texts.descriptionIsRecorded : texts.descriptionIsNotRecorded,
      textChannels: pupa(
        eclass.subject.voiceChannelId ? texts.descriptionAllChannels : texts.descriptionTextChannel, { eclass },
      ),
      where: config.messages.where(eclass),
    }))
    .setFooter({ text: pupa(texts.footer, eclass) });

  await classChannel?.send({
    content: pupa(config.messages.startClassNotification, { classRole: eclass.classRoleId }),
    embeds: [embed],
  });

  // Mark the class as In Progress
  await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.InProgress });

  container.logger.debug(`[e-class:${eclass.classId}] Started class.`);
}

export async function finishClass(eclass: EclassPopulatedDocument): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager.get(eclass.announcementChannelId, eclass.guildId);
  if (!announcementChannel)
    throw new Error(`Could not find [eclass:${eclass.classId} announcement's channel (${eclass.announcementChannelId}).`);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessageId);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  const dateField = announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.date);
  if (dateField) {
    dateField.value = pupa(config.messages.newClassEmbed.dateValueFinished, eclass.normalizeDates());
  } else {
    announcementEmbed.addFields({
      name: config.messages.newClassEmbed.date,
      value: pupa(config.messages.newClassEmbed.dateValueFinished, eclass.normalizeDates()),
      inline: true,
    });
  }
  await announcementMessage.edit({ embeds: [announcementEmbed] });

  // Remove the associated role
  await container.client
    .guilds.cache.get(eclass.guildId)
    ?.roles.cache.get(eclass.classRoleId)
    ?.delete('Class finished');

  // Mark the class as finished
  await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.Finished });

  // Edit the global week-upcoming-classes announcement messages
  await EclassMessagesManager.updateUpcomingClassesForGuild(eclass.guildId);

  container.logger.debug(`[e-class:${eclass.classId}] Ended class.`);
}

export async function cancelClass(eclass: EclassPopulatedDocument): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager.get(eclass.announcementChannelId, eclass.guildId);
  if (!announcementChannel)
    throw new Error(`Could not find [eclass:${eclass.classId} announcement's channel (${eclass.announcementChannelId}).`);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessageId);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  announcementEmbed.setColor(settings.colors.red);
  announcementEmbed.setDescription(config.messages.valueCanceled);
  announcementEmbed.spliceFields(0, EmbedLimits.MaximumFields);
  await announcementMessage.edit({ embeds: [announcementEmbed] });
  await announcementMessage.reactions.removeAll();

  // Remove from cache
  container.client.eclassRolesIds.delete(announcementMessage.id);

  // Remove the associated role
  await container.client
    .guilds.cache.get(eclass.guildId)
    ?.roles.cache.get(eclass.classRoleId)
    ?.delete('Class canceled');

  // Mark the class as finished
  await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.Canceled });

  // Edit the global week-upcoming-classes announcement messages
  await EclassMessagesManager.updateUpcomingClassesForGuild(eclass.guildId);

  container.logger.debug(`[e-class:${eclass.classId}] Canceled class.`);
}

export async function addRecordLink(
  eclass: EclassPopulatedDocument,
  recordLink: string,
  silent = false,
): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager.get(eclass.announcementChannelId, eclass.guildId);
  if (!announcementChannel)
    throw new Error(`Could not find [eclass:${eclass.classId} announcement's channel (${eclass.announcementChannelId}).`);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessageId);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  const recordField = announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.recorded);
  const baseValue = config.messages.recordedValues[Number(eclass.isRecorded)];
  const linksValue = [...eclass.recordLinks, recordLink]
    .map(link => pupa(config.messages.recordedLink, { link }))
    .join(', ');
  if (recordField) {
    recordField.value = `${baseValue}\n${linksValue}`;
  } else {
    announcementEmbed.addFields({
      name: config.messages.newClassEmbed.recorded,
      value: `${baseValue}\n${linksValue}`,
      inline: true,
    });
  }

  await announcementMessage.edit({ embeds: [announcementEmbed] });

  if (!silent) {
    // Send the link in the corresponding text channel
    const classChannel = container.client
      .guilds.resolve(eclass.guildId)
      ?.channels.resolve(eclass.subject.textChannelId) as GuildTextBasedChannel | undefined;
    await classChannel?.send(pupa(config.messages.linkAnnouncement, {
      topic: eclass.topic,
      date: dayjs(eclass.date).format(settings.configuration.dateFormat),
      link: recordLink,
    }));
  }

  // Store the link in the DB
  await Eclass.findByIdAndUpdate(eclass._id, { $push: { recordLinks: recordLink } });

  container.logger.debug(`[e-class:${eclass.classId}] Added record link.`);
}

export async function removeRecordLink(eclass: EclassPopulatedDocument, recordLink: string): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager.get(eclass.announcementChannelId, eclass.guildId);
  if (!announcementChannel)
    throw new Error(`Could not find [eclass:${eclass.classId} announcement's channel (${eclass.announcementChannelId}).`);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessageId);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  const recordField = announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.recorded);
  const baseValue = config.messages.recordedValues[Number(eclass.isRecorded)];
  const linksValue = eclass.recordLinks
    .filter(link => link !== recordLink)
    .map(link => pupa(config.messages.recordedLink, { link }))
    .join(', ');
  if (recordField) {
    recordField.value = `${baseValue}\n${linksValue}`;
  } else {
    announcementEmbed.addFields({
      name: config.messages.newClassEmbed.recorded,
      value: config.messages.recordedValues[Number(eclass.isRecorded)],
      inline: true,
    });
  }
  await announcementMessage.edit({ embeds: [announcementEmbed] });

  // Store the link in the DB
  await Eclass.findByIdAndUpdate(eclass._id, { $pull: { recordLinks: recordLink } });

  container.logger.debug(`[e-class:${eclass.classId}] Removed record link.`);
}

export async function remindClass(eclass: EclassPopulatedDocument): Promise<void> {
  // Mark the reminder as sent
  await Eclass.findByIdAndUpdate(eclass._id, { reminded: true });

  // Resolve the associated channel
  const guild = container.client.guilds.resolve(eclass.guildId);
  if (!guild)
    return;

  const classChannel = guild.channels.resolve(eclass.subject.textChannelId) as GuildTextBasedChannel;

  // Alert the professor
  const professor = await guild.members.fetch({ user: eclass.professorId, cache: false }).catch(nullop);

  await professor?.send(
    pupa(config.messages.alertProfessor, {
      ...eclass.toJSON(),
      ...eclass.normalizeDates(),
      where: config.messages.where(eclass),
      beforeChecklist: eclass.isRecorded
        ? config.messages.alertProfessorComplements.startRecord
        : '',
      afterChecklist: eclass.isRecorded
        ? pupa(config.messages.alertProfessorComplements.registerRecording, eclass)
        : '',
      isIsNot: eclass.isRecorded
        ? config.messages.alertProfessorComplements.isRecorded
        : config.messages.alertProfessorComplements.isNotRecorded,
      notIsRecorded: (!eclass.isRecorded).toString(),
    }),
  ).catch(nullop);

  // Send the notification to the eclass channel
  const payload = {
    ...eclass.toJSON(),
    ...eclass.normalizeDates(),
    where: config.messages.where(eclass),
  };
  await classChannel.send(pupa(config.messages.remindClassNotification, payload));

  // Send the private message to the subscribers
  const reminder = pupa(config.messages.remindClassPrivateNotification, payload);
  await massSend(guild, eclass.subscriberIds, reminder);

  container.logger.debug(`[e-class:${eclass.classId}] Sent reminders.`);
}

export async function subscribeMember(member: GuildMember, eclass: EclassPopulatedDocument): Promise<void> {
  if (eclass.status !== EclassStatus.Planned)
    return;
  if (eclass.professorId === member.id)
    return;

  const givenRole = member.guild.roles.cache.get(eclass.classRoleId);
  if (!givenRole) {
    container.logger.warn(`[e-class:${eclass.classId}] The role with id ${eclass.classRoleId} does not exist.`);
    return;
  }

  await Eclass.findByIdAndUpdate(eclass._id, { $addToSet: { subscribers: member.id } });
  if (!member.roles.cache.get(givenRole.id))
    await member.roles.add(givenRole);

  member.send(pupa(config.messages.subscribed, eclass)).catch(noop);

  container.logger.debug(`[e-class:${eclass.classId}] Subscribed member ${member.id} (${member.user.tag}).`);
}

export async function unsubscribeMember(member: GuildMember, eclass: EclassPopulatedDocument): Promise<void> {
  if (eclass.status !== EclassStatus.Planned)
    return;

  const givenRole = member.guild.roles.cache.get(eclass.classRoleId);
  if (!givenRole) {
    container.logger.warn(`[e-class:${eclass.classId}] The role with id ${eclass.classRoleId} does not exist.`);
    return;
  }

  await Eclass.findByIdAndUpdate(eclass._id, { $pull: { subscribers: member.id } });
  if (member.roles.cache.get(givenRole.id))
    await member.roles.remove(givenRole);

  member.send(pupa(config.messages.unsubscribed, eclass)).catch(noop);

  container.logger.debug(`[e-class:${eclass.classId}] Unsubscribed member ${member.id} (${member.user.tag}).`);
}

export function validateDateSpan(date: Date): boolean {
  return dayjs(date).isBetween(dayjs(), dayjs().add(2, 'months'));
}

export async function checkOverlaps(
  data: Partial<Pick<EclassPopulatedDocument, 'classId'>> & Pick<EclassPopulatedDocument, 'date' | 'duration' | 'professorId' | 'subject'>,
): Promise<Option<string>> {
  const myStart = data.date;
  const myEnd = new Date(myStart.getTime() + data.duration);

  const allOverlapping = await Eclass.find<EclassPopulatedDocument>({
    classId: { $ne: data.classId },
    status: EclassStatus.Planned,
    date: { $lte: myEnd },
    end: { $gte: myStart },
  });

  const schoolYearOverlap = allOverlapping.some(eclass => eclass.subject.schoolYear === data.subject.schoolYear);
  const professorOverlap = allOverlapping.some(eclass => eclass.professorId === data.professorId);

  if (professorOverlap || schoolYearOverlap)
    return Option.some(schoolYearOverlap ? config.messages.schoolYearOverlap : config.messages.professorOverlap);

  return Option.none;
}
