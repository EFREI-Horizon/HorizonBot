import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions, UserError } from '@sapphire/framework';
import pdf_merger_js from 'pdf-merger-js';
import pupa from 'pupa';
import { ping as config } from '@/config/commands/general';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';
import * as fs from 'fs';
import { MessageManager } from 'discord.js';

@ApplyOptions<CommandOptions>(config.options)
export default class PdfMergeCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    // Argument dans l'ordre croissant

    const msgIds: string[] = [];
    while (!args.finished) {
        const msgId = await args.pickResult('string');
        if (msgId.success) {
            msgIds.push(msgId.value);
        } else {
            const { parameter } = (msgId.error as UserError & { parameter: string });
            await message.channel.send(pupa('Le pdf situé au message {id} est introuvable !', { id: parameter }));
            return;
        }
    }

    const merger = new pdf_merger_js();
    const msgManager: MessageManager = message.channel.messages;

    (async () => {
        for(let o of msgIds) {
            const msg = msgManager.cache.get(o);
            merger.add(msg.attachments.first().name)
        }
    });

    await message.channel.send({
        files: [{
            attachment: await merger.save('merged.pdf'),
            name: 'merged.pdf'
        }]
    });
  }
}
