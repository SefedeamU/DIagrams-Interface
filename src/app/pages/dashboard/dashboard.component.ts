import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DiagramsService } from '../../services/diagrams.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ChatFloatComponent } from '../../utils/chat-float/chat-float.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatFloatComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  code = '';
  imagen: string | null = null;
  loading = false;
  error = '';
  modoPerfil = false;

  svg: string | null = null;
  safeSvg: SafeHtml | null = null;

  leftWidth = 750;
  resizing = false;
  editorInnerWidth = 500;
  resizingInner = false;

  zoomLevel = 1; // zoom inicial
  minZoom = 0.2;
  maxZoom = 3;
  zoomStep = 0.1;

  isPanning = false;
  startX = 0;
  startY = 0;
  offsetX = 0;
  offsetY = 0;

  mostrarModalExportar = false;

  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
  }

  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }


  @ViewChild('editorArea') editorArea!: ElementRef<HTMLTextAreaElement>;
  editorRect: DOMRect | null = null;
  mostrarChat = false;

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = Math.sign(event.deltaY);
      if (delta > 0) {
        // Zoom out
        this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
      } else {
        // Zoom in
        this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
      }
    }
  }


  constructor(
    private diagramsService: DiagramsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const savedWidth = sessionStorage.getItem('dashboard_leftWidth');
    if (savedWidth) {
      this.leftWidth = +savedWidth;
    }
  }

  // Lógica para arrastrar el divisor
  startResizing(event: MouseEvent) {
    this.resizing = true;
    event.preventDefault();
  }

  @HostListener('document:mouseup')
  stopResizing() {
    this.resizing = false;
    this.resizingInner = false;
  }

  toggleChat() {
    this.mostrarChat = !this.mostrarChat;
  }

  startPan(event: MouseEvent) {
    this.isPanning = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
  }

  endPan() {
    this.isPanning = false;
  }

  onPan(event: MouseEvent) {
    if (!this.isPanning) return;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    this.offsetX += dx;
    this.offsetY += dy;

    this.startX = event.clientX;
    this.startY = event.clientY;
  }


  // Lógica para generar el diagrama
generarDiagrama() {
  this.imagen = null;
  this.safeSvg = null;
  this.error = '';
  this.loading = true;

  const body = { body: this.code };
  localStorage.setItem('ultimo_body_diagrama', JSON.stringify(body));

  this.diagramsService.generarDiagrama(body.body).subscribe({
    next: (res) => {
      let svgString = res.svg_image;

      try {
        svgString = JSON.parse('"' + svgString.replace(/"/g, '\\"') + '"');
      } catch (e) {
        console.warn('Error al desescapar SVG:', e);
      }

      // 🔧 Limpieza profunda del SVG
      svgString = svgString
        // Remover fondos blancos
        .replace(/(<[^>]+?)fill="white"/gi, '$1fill="none"')
        .replace(/(<[^>]+?)stroke="white"/gi, '$1stroke="none"')
        .replace(/(style="[^"]*)fill:\s?white;?/gi, '$1fill:none;')
        .replace(/(style="[^"]*)stroke:\s?white;?/gi, '$1stroke:none;')
        .replace(/(stroke|fill)\s*:\s*white/gi, '$1: none')
        // 🎨 Forzar texto blanco
        .replace(/(<text[^>]*?)fill="[^"]*"/gi, '$1fill="white"')
        .replace(/(style="[^"]*?)fill:\s?#?[0-9a-fA-F]{3,6};?/gi, '$1fill:white;');

      console.log('SVG final (textos blancos + fondo transparente):', svgString);

      this.safeSvg = this.sanitizer.bypassSecurityTrustHtml(svgString);
      this.svg = svgString;
      this.imagen = res.png_image;

      this.loading = false;
    },
    error: (err) => {
      this.error = 'No se pudo generar el diagrama.';
      this.loading = false;
    }
  });
}

  descargarImagenSVG() {
    if (!this.svg) return;

    const blob = new Blob([this.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'mi-diagrama.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  descargarImagenPNG() {
    if (!this.imagen) return;

    const link = document.createElement('a');
    link.href = this.imagen;
    link.download = 'mi-diagrama.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Lógica para cambiar entre modo dashboard y perfil
  generarEjemplo() {
    console.log('Generar ejemplo emojicode');
  }

  irADashboard() {
    this.modoPerfil = false;
  }

  irAPerfil() {
    this.modoPerfil = true;
  }

  startInnerResize(event: MouseEvent) {
    this.resizingInner = true;
    event.preventDefault();
  }

@HostListener('document:mousemove', ['$event'])
onMouseMove(event: MouseEvent) {
  // Divisor principal
  if (this.resizing) {
    const totalWidth = window.innerWidth;
    const sidebarWidth = 96;
    const previewMinWidth = 300;
    const divisorWidth = 8;
    const maxLeft = totalWidth - sidebarWidth - previewMinWidth - divisorWidth;

    this.leftWidth = Math.max(180, Math.min(event.clientX - sidebarWidth, maxLeft));
    sessionStorage.setItem('dashboard_leftWidth', String(this.leftWidth));
  }

  // Divisor interno entre editor y chat
  if (this.resizingInner) {
    const container = document.getElementById('editor-chat-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const minEditorWidth = 180;
      const maxEditorWidth = containerRect.width - 250 - 12;

      const newWidth = event.clientX - containerRect.left;
      this.editorInnerWidth = Math.max(minEditorWidth, Math.min(newWidth, maxEditorWidth));
      sessionStorage.setItem('dashboard_editorInnerWidth', String(this.editorInnerWidth));
    }
  }
}


}
