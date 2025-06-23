import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'codeFormat', standalone: true })
export class CodeFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    // Agrega botón de copiar a cada bloque de código
    value = value.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
  const codeId = 'code-' + Math.random().toString(36).substring(2, 10);
      return `
        <div class="relative group my-2">
          
          <pre id="${codeId}" class="bg-gray-800 rounded p-3 overflow-x-auto text-sm max-w-full whitespace-pre-wrap"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>
      `;
    });
    // Resalta inline code
    value = value.replace(/`([^`]+)`/g, '<code class="bg-gray-700 rounded px-1">$1</code>');
    // Resalta títulos markdown
    value = value.replace(/^### (.*)$/gm, '<strong class="block mt-3 mb-1 text-emerald-400">$1</strong>');
    value = value.replace(/^(\d+)\. (.*)$/gm, '<div class="ml-4"><span class="font-bold">$1.</span> $2</div>');
    value = value.replace(/^\* (.*)$/gm, '<div class="ml-4">• $1</div>');
    return value;
  }
}
