import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-float',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-float.component.html',
  styleUrls: ['./chat-float.component.css']
})
export class ChatFloatComponent {
  mensaje = '';
  inputActivo = false;

  mensajes: { texto: string, tipo: 'user' | 'bot' }[] = [
    { texto: '¡Hola! ¿En qué puedo ayudarte?', tipo: 'bot' }
  ];

  enviarMensaje() {
    if (this.mensaje.trim()) {
      this.mensajes.push({ texto: this.mensaje, tipo: 'user' });
      setTimeout(() => {
        this.mensajes.push({ texto: 'Respuesta de la IA a: ' + this.mensaje, tipo: 'bot' });
      }, 800);
      this.mensaje = '';
    }
  }

}
