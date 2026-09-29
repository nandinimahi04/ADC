import { Injectable } from '@angular/core';

import { DesktopAgentService } from './desktop-agent.service';
import {
  APP_LABELS,
  HELP_TEXT,
  Intent,
  POWER_LABELS,
  isNo,
  isYes,
  parseMessage
} from './chat-rules';

export type BotReplyType = 'info' | 'success' | 'error' | 'confirm';

export interface BotReply {
  text: string;
  type: BotReplyType;
}

export interface ChatResult {
  replies: BotReply[];
  clearChat?: boolean;
}

interface SystemInfoData {
  deviceName?: string;
  operatingSystem?: string;
  hasBattery?: boolean;
  batteryPercentage?: number | null;
  isCharging?: boolean | null;
}

/**
 * Runs the intents found by chat-rules.ts against the desktop agent.
 * Power commands (shutdown / restart / lock / sleep) always need a
 * "yes" from the user first.
 */
@Injectable({
  providedIn: 'root'
})
export class ChatEngineService {

  /** Intents waiting for the user's yes / no. */
  private pending: Intent[] | null = null;

  constructor(private desktopAgent: DesktopAgentService) {}

  get hasPending(): boolean {
    return this.pending !== null;
  }

  async handle(input: string): Promise<ChatResult> {
    const text = input.trim();
    const prefix: BotReply[] = [];

    if (this.pending) {
      if (isYes(text)) {
        const list = this.pending;
        this.pending = null;
        return this.run(list, true);
      }

      if (isNo(text)) {
        this.pending = null;
        return { replies: [{ text: 'Okay, cancelled.', type: 'info' }] };
      }

      // User typed something else -> drop the old request
      this.pending = null;
      prefix.push({ text: 'Previous action cancelled.', type: 'info' });
    } else if (isYes(text) || isNo(text)) {
      return { replies: [{ text: 'Nothing is waiting for confirmation right now.', type: 'info' }] };
    }

    const result = await this.run(parseMessage(text), false);
    return { ...result, replies: [...prefix, ...result.replies] };
  }

  // ============================================================
  // RUN INTENTS ONE BY ONE
  // ============================================================

  private async run(intents: Intent[], skipFirstConfirm: boolean): Promise<ChatResult> {
    const replies: BotReply[] = [];
    let clearChat = false;

    for (let i = 0; i < intents.length; i++) {
      const intent = intents[i];

      if (intent.type === 'power' && !(skipFirstConfirm && i === 0)) {
        this.pending = intents.slice(i);
        replies.push({
          text: `Do you really want to ${POWER_LABELS[intent.command].ask} your PC? Reply "yes" or "no".`,
          type: 'confirm'
        });
        break;
      }

      if (intent.type === 'clear_chat') {
        clearChat = true;
      }

      replies.push(...(await this.execute(intent)));
    }

    return { replies, clearChat };
  }

  private async execute(intent: Intent): Promise<BotReply[]> {
    switch (intent.type) {

      case 'open_app': {
        const label = APP_LABELS[intent.app];
        try {
          await this.desktopAgent.openApplication(intent.app);
          return [{ text: `Opened ${label} on your PC.`, type: 'success' }];
        } catch (error) {
          return [{ text: `Couldn't open ${label}. ${this.friendlyError(error)}`, type: 'error' }];
        }
      }

      case 'power': {
        try {
          await this.desktopAgent.executeSystemCommand(intent.command);
          return [{ text: POWER_LABELS[intent.command].done, type: 'success' }];
        } catch (error) {
          return [{ text: `Couldn't ${POWER_LABELS[intent.command].ask} the PC. ${this.friendlyError(error)}`, type: 'error' }];
        }
      }

      case 'battery': {
        try {
          const data = await this.getInfo();
          if (!data.hasBattery) {
            return [{ text: 'This PC has no battery (it is probably a desktop).', type: 'info' }];
          }
          const level = typeof data.batteryPercentage === 'number' ? `${data.batteryPercentage}%` : 'unknown';
          const charging = data.isCharging === true ? ' and charging' : data.isCharging === false ? ' (not charging)' : '';
          return [{ text: `Battery is ${level}${charging}.`, type: 'info' }];
        } catch (error) {
          return [{ text: `Couldn't read the battery. ${this.friendlyError(error)}`, type: 'error' }];
        }
      }

      case 'system_info': {
        try {
          const data = await this.getInfo();
          const lines = [
            `Device: ${data.deviceName || 'Unknown'}`,
            `OS: ${data.operatingSystem || 'Unknown'}`
          ];
          if (data.hasBattery) {
            const level = typeof data.batteryPercentage === 'number' ? `${data.batteryPercentage}%` : 'unknown';
            lines.push(`Battery: ${level}${data.isCharging ? ' (charging)' : ''}`);
          }
          return [{ text: lines.join('\n'), type: 'info' }];
        } catch (error) {
          return [{ text: `Couldn't read system info. ${this.friendlyError(error)}`, type: 'error' }];
        }
      }

      case 'connection': {
        try {
          const data = await this.getInfo();
          return [{ text: `Yes, you're connected to ${data.deviceName || 'your PC'}.`, type: 'success' }];
        } catch (error) {
          return [{ text: `Not connected. ${this.friendlyError(error)}`, type: 'error' }];
        }
      }

      case 'help':
        return [{ text: HELP_TEXT, type: 'info' }];

      case 'greeting':
        return [{ text: 'Hi! Tell me what to do on your PC, e.g. "open Chrome". Type "help" to see everything.', type: 'info' }];

      case 'thanks':
        return [{ text: "You're welcome!", type: 'info' }];

      case 'clear_chat':
        return [{ text: 'Chat cleared.', type: 'info' }];

      case 'need_app':
        return [{ text: 'Which app should I open? I can open Chrome, Notepad, VS Code or Calculator.', type: 'info' }];

      case 'unknown_app':
        return [{
          text: `I can't open "${intent.name}" yet. I can open Chrome, Notepad, VS Code or Calculator.`,
          type: 'info'
        }];

      case 'close_unsupported':
        return [{ text: "I can only open apps for now, I can't close them yet.", type: 'info' }];

      default:
        return [{
          text: `Sorry, I didn't understand "${intent.text}". Try "open Chrome", "battery" or "help".`,
          type: 'info'
        }];
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async getInfo(): Promise<SystemInfoData> {
    const response = await this.desktopAgent.getSystemInfo();
    return (response.data ?? {}) as SystemInfoData;
  }

  private friendlyError(error: unknown): string {
    const message = error instanceof Error ? error.message : '';

    if (!message || /failed to fetch|networkerror|load failed/i.test(message)) {
      return "I can't reach your PC. Make sure the desktop agent is running and both devices are on the same Wi-Fi.";
    }
    return message;
  }
}