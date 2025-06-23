import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, EventEmitter, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CodeFormatPipe } from '../../pipes/code-format.pipe';
import { IaAgentService } from '../../services/ia-agent.service';
@Component({
  selector: 'app-chat-float',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeFormatPipe],
  templateUrl: './chat-float.component.html',
  styleUrls: ['./chat-float.component.css']
})
export class ChatFloatComponent implements OnInit {
  mensaje = '';
  inputActivo = false;

  @ViewChild('chatScroll') chatScroll!: ElementRef<HTMLDivElement>;
  // Vincula los mensajes al signal del servicio
  mensajes = computed(() => this.iaAgent.messages());

  constructor(private iaAgent: IaAgentService, private zone: NgZone) {}

  ngOnInit(): void {
    this.iaAgent.loadUserConversations();
    //this.iaAgent.loadFullConversation(); // Carga el historial de la conversación IA
    setTimeout(() => this.scrollToBottom(), 300);
  }

  ngAfterViewInit(): void {
    this.setupDynamicCopyButtons();
  }

  private setupDynamicCopyButtons() {
    const container = this.chatScroll?.nativeElement;
    if (!container) return;

    // Observa cambios en el DOM del chat
    const observer = new MutationObserver(() => {
      this.attachCopyListeners();
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    this.attachCopyListeners(); // Ejecuta al inicio
  }

  private attachCopyListeners() {
    const buttons = this.chatScroll?.nativeElement.querySelectorAll('.copy-code-btn');
    if (!buttons) return;

    buttons.forEach((btn) => {
      btn.removeEventListener('click', this.onCopyClick as any); // Evita duplicar listeners
      btn.addEventListener('click', this.onCopyClick);
    });
  }

  private onCopyClick = (event: Event) => {
    const target = event.currentTarget as HTMLElement;
    const codeId = target.getAttribute('data-code-id');
    const codeEl = document.getElementById(codeId || '');
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.innerText).then(() => {
        this.zone.run(() => {
          target.innerHTML = `
            <span class="material-icons" style="font-size:16px;vertical-align:middle;">check</span>
          `;
          setTimeout(() => {
            target.innerHTML = `
              <span class="material-icons" style="font-size:16px;vertical-align:middle;">content_copy</span>
            `;
          }, 1200);
        });
      });
    }
  };


  private setupCopyListenerWithObserver() {
    const observer = new MutationObserver(() => {
      this.addCopyCodeListener(); // Reaplica listeners cuando el DOM cambia
    });

    if (this.chatScroll?.nativeElement) {
      observer.observe(this.chatScroll.nativeElement, {
        childList: true,
        subtree: true
      });

      this.addCopyCodeListener(); // primer registro
    }
  }


  private addCopyCodeListener() {
    if (this.chatScroll) {
      this.chatScroll.nativeElement.addEventListener('click', (event: any) => {
        const target = event.target.closest('.copy-code-btn');
        if (target) {
          const codeId = target.getAttribute('data-code-id');
          const codeEl = document.getElementById(codeId);
          if (codeEl) {
            navigator.clipboard.writeText(codeEl.innerText);
            target.innerHTML = '<span class="material-icons" style="font-size:16px;vertical-align:middle;">check</span>';
            setTimeout(() => {
              target.innerHTML = '<span class="material-icons" style="font-size:16px;vertical-align:middle;">content_copy</span>';
            }, 1200);
          }
        }
      });
    }
  }

  enviarMensaje() {
    if (this.mensaje.trim()) {
      const textoUsuario = this.mensaje;
      // Agrega el mensaje del usuario al signal del servicio
      this.iaAgent.messages.set([
        ...this.iaAgent.messages(),
        { text: textoUsuario, sender: 'user' }
      ]);
      this.mensaje = '';

      this.iaAgent.askAgent(textoUsuario).subscribe({
        next: (res) => {
          const respuesta = res.iaResponse || res.response || res.text || 'No hubo respuesta de la IA.';
          // Agrega la respuesta del bot al signal del servicio
          this.iaAgent.messages.set([
          ...this.iaAgent.messages(),
          { text: respuesta, sender: 'bot' }
        ]);
        },
        error: () => {
          this.iaAgent.messages.set([
          ...this.iaAgent.messages(),
          { text: 'Ocurrió un error al consultar la IA.', sender: 'bot' }
        ]);
        }
      });
    }
  }

  private scrollToBottom() {
    if (this.chatScroll) {
      this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
    }
  }
}
