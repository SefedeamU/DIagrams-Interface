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
  private apiUrl = 'http://18.214.247.229:8001/memory';
  userName = signal<string>('usuario');

  conversations = signal<Conversation[]>([]);
  loadingConversations = signal<boolean>(true);

  activeConversationId = signal<string | null>(null);
  messages = signal<Message[]>([]);

  constructor(private http: HttpClient) {}

  askAgent(dto: UserQueryDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ask`, dto);
  }

  loadUserConversations(userId: number): void {
    this.loadingConversations.set(true);
    this.http.get<Conversation[]>(`${this.apiUrl}/conversations/${userId}`)
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

  createConversation(userId: number, title: string = 'Nueva conversación'): Observable<any> {
    const payload = { userId, title };
    return this.http.post(`${this.apiUrl}/conversation`, payload);
  }

  deleteConversation(conversationId: string): void {
    const userId = Number(localStorage.getItem('user_id'));
    this.http.delete(`${this.apiUrl}/conversation/${userId}/${conversationId}`)
      .subscribe({
        next: () => {
          this.loadUserConversations(userId);
          if (this.activeConversationId() === conversationId) {
            this.activeConversationId.set(null);
            this.messages.set([]);
          }
        },
        error: (err) => {
          console.error('❌ Error eliminando la conversación:', err);
        }
      });
  }

  loadFullConversation(conversationId: string): void {
    const userId = Number(localStorage.getItem('user_id'));
    if (!userId) return;

    this.activeConversationId.set(conversationId);

    this.http.get<any[]>(`${this.apiUrl}/conversation-full/${userId}/${conversationId}`)
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
