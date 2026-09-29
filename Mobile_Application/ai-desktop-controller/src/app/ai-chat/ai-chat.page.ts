import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonFooter
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  gridOutline,
  chatbubbleEllipsesOutline,
  appsOutline,
  timeOutline,
  settingsOutline,
  hardwareChipOutline,
  trashOutline,
  send
} from 'ionicons/icons';

import { BotReplyType, ChatEngineService } from '../services/chat-engine.service';

interface ChatMessage {
  id: number;
  from: 'user' | 'bot';
  text: string;
  type: BotReplyType;
  time: number;
}

const STORAGE_KEY = 'ai_chat_history';
const MAX_SAVED_MESSAGES = 60;

@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.page.html',
  styleUrls: ['./ai-chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonFooter
  ]
})
export class AiChatPage implements OnInit, AfterViewInit {

  @ViewChild(IonContent) content?: IonContent;

  messages: ChatMessage[] = [];
  draft = '';
  busy = false;
  keyboardOpen = false;

  readonly chips: string[] = [
    'Open Chrome',
    'Open Notepad',
    'Open VS Code',
    'Open Calculator',
    'Battery',
    'System info',
    'Help'
  ];

  private nextId = 1;

  constructor(
    private engine: ChatEngineService,
    private router: Router
  ) {
    addIcons({
      gridOutline,
      chatbubbleEllipsesOutline,
      appsOutline,
      timeOutline,
      settingsOutline,
      hardwareChipOutline,
      trashOutline,
      send
    });
  }

  ngOnInit(): void {
    this.loadHistory();

    if (this.messages.length === 0) {
      this.addMessage(
        'bot',
        'Hi! I control your PC. Try "open Chrome", "lock pc" or "battery". Type "help" to see everything.',
        'info'
      );
    }
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  /** True when the last bot message is a yes/no question. */
  get awaitingConfirm(): boolean {
    const last = this.messages[this.messages.length - 1];
    return !!last && last.from === 'bot' && last.type === 'confirm' && this.engine.hasPending && !this.busy;
  }

  async send(text?: string): Promise<void> {
    const content = (text ?? this.draft).trim();
    if (!content || this.busy) return;

    this.draft = '';
    this.addMessage('user', content, 'info');
    this.busy = true;
    this.scrollToBottom();

    try {
      const result = await this.engine.handle(content);

      if (result.clearChat) {
        this.messages = [];
      }

      result.replies.forEach((reply) => this.addMessage('bot', reply.text, reply.type));
    } catch (error) {
      this.addMessage('bot', 'Something went wrong. Please try again.', 'error');
    } finally {
      this.busy = false;
      this.saveHistory();
      this.scrollToBottom();
    }
  }

  clearChat(): void {
    this.messages = [];
    this.addMessage('bot', 'Chat cleared. What should I do next?', 'info');
    this.saveHistory();
  }

  trackById(_: number, message: ChatMessage): number {
    return message.id;
  }

  onNavClick(tab: 'dashboard' | 'ai-chat' | 'control' | 'history' | 'settings'): void {
    if (tab === 'ai-chat') return;
    if (tab === 'dashboard') {
      this.router.navigate(['/dashboard']);
      return;
    }
    if (tab === 'control') {
      this.router.navigate(['/control']);
      return;
    }
    alert('This page is not developed yet.');
  }

  // ============================================================
  // INTERNAL
  // ============================================================

  private addMessage(from: 'user' | 'bot', text: string, type: BotReplyType): void {
    this.messages.push({ id: this.nextId++, from, text, type, time: Date.now() });
    this.saveHistory();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => this.content?.scrollToBottom(250), 60);
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.messages.slice(-MAX_SAVED_MESSAGES))
      );
    } catch {
      /* storage full or unavailable - ignore */
    }
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as ChatMessage[];
      if (!Array.isArray(parsed)) return;

      this.messages = parsed;
      this.nextId = parsed.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    } catch {
      this.messages = [];
    }
  }

}