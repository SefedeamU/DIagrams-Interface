import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiagramsService {

  private apiUrl = 'https://qohv83nyg6.execute-api.us-east-1.amazonaws.com/prod/diagram';

  constructor(private http: HttpClient) { }

  generarDiagrama(code: string): Observable<{ svg_image: string; png_image: string }> {
    return this.http.post<{ svg_image: string; png_image: string }>(this.apiUrl, { body: code });
  }
}
