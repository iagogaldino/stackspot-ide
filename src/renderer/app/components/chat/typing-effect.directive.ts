import { Directive, ElementRef, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTypingEffect]',
  standalone: true
})
export class TypingEffectDirective implements OnInit, OnDestroy, OnChanges {
  @Input('appTypingEffect') text: string = '';
  @Input() speed: number = 30; // ms por caractere
  @Input() enabled: boolean = true;

  private currentText: string = '';
  private typingInterval?: any;
  private isTyping: boolean = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    if (this.enabled && this.text) {
      this.startTyping();
    } else {
      this.renderer.setProperty(this.el.nativeElement, 'textContent', this.text);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['text'] && !changes['text'].firstChange) {
      this.stopTyping();
      if (this.enabled && this.text) {
        this.startTyping();
      } else {
        this.renderer.setProperty(this.el.nativeElement, 'textContent', this.text);
      }
    }
  }

  ngOnDestroy() {
    this.stopTyping();
  }

  private startTyping() {
    this.currentText = '';
    this.isTyping = true;
    const fullText = this.text;
    
    let index = 0;
    this.typingInterval = setInterval(() => {
      if (index < fullText.length) {
        // Adicionar próximo caractere
        this.currentText += fullText[index];
        this.renderer.setProperty(this.el.nativeElement, 'textContent', this.currentText);
        index++;
      } else {
        this.stopTyping();
      }
    }, this.speed);
  }

  private stopTyping() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = undefined;
    }
    this.isTyping = false;
    // Garantir que o texto completo está exibido
    if (this.currentText !== this.text) {
      this.renderer.setProperty(this.el.nativeElement, 'textContent', this.text);
    }
  }
}

