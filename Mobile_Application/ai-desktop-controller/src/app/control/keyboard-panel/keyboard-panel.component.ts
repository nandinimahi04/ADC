import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  closeOutline,
  keypadOutline,
  backspaceOutline,
  returnDownBackOutline,
  arrowUpOutline,
  arrowDownOutline,
  arrowBackOutline,
  arrowForwardOutline,
  trashOutline
} from 'ionicons/icons';

import { KeyboardService } from '../../services/keyboard.service';

type Modifier = 'ctrl' | 'alt' | 'shift' | 'win';

interface Shortcut {
  label: string;
  keys: string[];
}

@Component({
  selector: 'app-keyboard-panel',
  templateUrl: './keyboard-panel.component.html',
  styleUrls: ['./keyboard-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent
  ]
})
export class KeyboardPanelComponent implements AfterViewInit, OnDestroy {

  @Output() closed = new EventEmitter<void>();

  @ViewChild('typingBox') typingBox?: ElementRef<HTMLTextAreaElement>;

  /** What the text box contained after the last change we sent. */
  private lastValue = '';

  /** Active (one-shot) modifier keys. */
  modifiers: Record<Modifier, boolean> = {
    ctrl: false,
    alt: false,
    shift: false,
    win: false
  };

  readonly modifierList: { key: Modifier; label: string }[] = [
    { key: 'ctrl', label: 'Ctrl' },
    { key: 'alt', label: 'Alt' },
    { key: 'shift', label: 'Shift' },
    { key: 'win', label: 'Win' }
  ];

  readonly shortcuts: Shortcut[] = [
    { label: 'Copy', keys: ['ctrl', 'c'] },
    { label: 'Paste', keys: ['ctrl', 'v'] },
    { label: 'Cut', keys: ['ctrl', 'x'] },
    { label: 'Select All', keys: ['ctrl', 'a'] },
    { label: 'Undo', keys: ['ctrl', 'z'] },
    { label: 'Redo', keys: ['ctrl', 'y'] },
    { label: 'Save', keys: ['ctrl', 's'] },
    { label: 'Alt + Tab', keys: ['alt', 'tab'] }
  ];

  errorMessage = '';
  private errorTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private keyboard: KeyboardService,
    private zone: NgZone
  ) {
    addIcons({
      closeOutline,
      keypadOutline,
      backspaceOutline,
      returnDownBackOutline,
      arrowUpOutline,
      arrowDownOutline,
      arrowBackOutline,
      arrowForwardOutline,
      trashOutline
    });

    this.keyboard.onError = (message: string) => {
      this.zone.run(() => this.showError(message));
    };
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.focusBox(), 400);
  }

  ngOnDestroy(): void {
    this.keyboard.onError = null;

    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  focusBox(): void {
    this.typingBox?.nativeElement.focus();
  }

  close(): void {
    this.closed.emit();
  }

  private showError(message: string): void {
    this.errorMessage = message;

    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }

    this.errorTimer = setTimeout(() => {
      this.errorMessage = '';
    }, 4000);
  }

  private activeModifiers(): Modifier[] {
    return this.modifierList
      .map((m) => m.key)
      .filter((key) => this.modifiers[key]);
  }

  private clearModifiers(): void {
    this.modifiers = { ctrl: false, alt: false, shift: false, win: false };
  }

  private resetBox(): void {
    this.lastValue = '';

    if (this.typingBox) {
      this.typingBox.nativeElement.value = '';
    }
  }

  // ============================================================
  // LIVE TYPING
  // Compares the new text box value with the previous one and
  // sends only the difference (works with Android/iOS keyboards,
  // autocorrect and word suggestions).
  // ============================================================

  onTyping(event: Event): void {
    const box = event.target as HTMLTextAreaElement;
    const newValue = box.value;
    const oldValue = this.lastValue;

    // Length of the part that did not change
    let common = 0;
    const max = Math.min(oldValue.length, newValue.length);

    while (common < max && oldValue[common] === newValue[common]) {
      common++;
    }

    const removedCount = oldValue.length - common;
    const inserted = newValue.slice(common);

    // 1. Characters removed -> Backspace on laptop
    if (removedCount > 0) {
      this.keyboard.pressKey('backspace', removedCount);
    }

    // 2. Characters added
    if (inserted.length > 0) {

      const mods = this.activeModifiers();

      // Modifier active + one character => shortcut (e.g. Ctrl + C)
      if (mods.length > 0 && inserted.length === 1 && inserted !== '\n') {
        this.keyboard.pressCombination([...mods, inserted.toLowerCase()]);
        this.clearModifiers();

        // Remove that letter from the phone box, it was a shortcut
        box.value = newValue.slice(0, common);
        this.lastValue = box.value;
        return;
      }

      // Some phone keyboards insert "\n" instead of sending Enter
      const parts = inserted.split('\n');

      parts.forEach((part, index) => {
        if (part) {
          this.keyboard.typeText(part);
        }

        if (index < parts.length - 1) {
          this.keyboard.pressKey('enter');
        }
      });

      if (parts.length > 1) {
        this.resetBox();
        return;
      }
    }

    this.lastValue = newValue;
  }

  onKeyDown(event: KeyboardEvent): void {

    // Enter: press Enter on laptop and clear the phone box
    if (event.key === 'Enter') {
      event.preventDefault();
      this.sendKey('enter');
      this.resetBox();
      return;
    }

    // Backspace on an empty box still deletes on the laptop
    if (event.key === 'Backspace' && this.lastValue.length === 0) {
      event.preventDefault();
      this.sendKey('backspace');
      return;
    }

    // Tab key from a hardware/bluetooth keyboard
    if (event.key === 'Tab') {
      event.preventDefault();
      this.sendKey('tab');
    }
  }

  // ============================================================
  // BUTTONS
  // ============================================================

  toggleModifier(key: Modifier): void {
    this.modifiers = { ...this.modifiers, [key]: !this.modifiers[key] };
  }

  /** Special key button (Esc, Tab, arrows...). Uses active modifiers. */
  sendKey(key: string): void {
    const mods = this.activeModifiers();

    if (mods.length > 0) {
      this.keyboard.pressCombination([...mods, key]);
      this.clearModifiers();
    } else {
      this.keyboard.pressKey(key);
    }
  }

  sendShortcut(shortcut: Shortcut): void {
    this.keyboard.pressCombination(shortcut.keys);
    this.clearModifiers();
  }

  /** Clears only the phone text box (nothing is deleted on the laptop). */
  clearBox(): void {
    this.resetBox();
    this.focusBox();
  }
}