import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserQueryDto {
  token: string;
  conversationId: string;
  userQuery: string;
}

export interface Conversation {
  conversationId: string;
  conversationNumber: string;
  createdAt: string;
  title: string;
}

export interface Message {
  sender: 'user' | 'bot';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class IaAgentService {
  private apiUrl = 'https://api.the-ecco.site/users';
  readonly iaUserId = 10; // <-- Hardcodeado
  readonly iaToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMCIsImV4cCI6MTc1MzA3MTUzNCwicm9sIjoiY3VzdG9tZXIifQ.NpEEtnuooKNh2fZwGHtRHz6F30uNQNCoHgUa45qBKb0';
  readonly iaConversationId = '2f7d77cc-e7c2-423b-9989-81d8af94de03'; // <-- Hardcodeado

  userName = signal<string>('IA');
  conversations = signal<Conversation[]>([]);
  loadingConversations = signal<boolean>(true);
  activeConversationId = signal<string | null>(null);
  messages = signal<Message[]>([]);

  constructor(private http: HttpClient) {}

  askAgent(userQuery: string): Observable<any> {
    const dto: UserQueryDto = {
      token: this.iaToken,
      conversationId: this.iaConversationId, // <-- Siempre usa este id
      userQuery
    };
    return this.http.post<any>(`${this.apiUrl}/ask`, dto);
  }

  loadUserConversations(): void {
    this.loadingConversations.set(true);
    this.http.get<Conversation[]>(`${this.apiUrl}/conversations/${this.iaUserId}`)
      .subscribe({
        next: (data) => {
          this.conversations.set(data);
          this.loadingConversations.set(false);
          this.cacheConversationsInLocalStorage(data);
        },
        error: (err) => {
          console.error('Error al cargar conversaciones', err);
          this.conversations.set([]);
          this.loadingConversations.set(false);
        }
      });
  }

  private cacheConversationsInLocalStorage(conversations: Conversation[]): void {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(' ')) localStorage.removeItem(key);
    });

    for (const convo of conversations) {
      const key = `chat_${convo.conversationNumber}`;
      localStorage.setItem(key, convo.conversationId);
    }
  }

  createConversation(title: string = 'Nueva conversación'): Observable<any> {
    const payload = { userId: this.iaUserId, title };
    return this.http.post(`${this.apiUrl}/conversation`, payload);
  }

  deleteConversation(): void {
    // Siempre usa el id hardcodeado
    this.http.delete(`${this.apiUrl}/conversation/${this.iaUserId}/${this.iaConversationId}`)
      .subscribe({
        next: () => {
          this.loadUserConversations();
          if (this.activeConversationId() === this.iaConversationId) {
            this.activeConversationId.set(null);
            this.messages.set([]);
          }
        },
        error: (err) => {
          console.error('❌ Error eliminando la conversación:', err);
        }
      });
  }

  loadFullConversation(): void {
    this.activeConversationId.set(this.iaConversationId);

    this.http.get<any[]>(`${this.apiUrl}/conversation-full/${this.iaUserId}/${this.iaConversationId}`)
      .subscribe({
        next: (history) => {
          const messages = history.flatMap(item => [
            { sender: 'user', text: item.userQuery } as const,
            { sender: 'bot', text: item.iaResponse } as const,
          ]);
          this.messages.set(messages);
        },
        error: (err) => {
          console.error('❌ Error cargando la conversación completa:', err);
          this.messages.set([
            { sender: 'bot', text: 'No se pudo cargar esta conversación.' }
          ]);
        }
      });
  }

  get orderedConversations() {
    return this.conversations().slice().sort(
      (a, b) => Number(a.conversationNumber) - Number(b.conversationNumber)
    );
  }

  resetState(): void {
    this.conversations.set([]);
    this.loadingConversations.set(true);
    this.activeConversationId.set(null);
    this.messages.set([]);
  }
}
