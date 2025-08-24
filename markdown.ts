import { marked } from 'marked';

// Custom renderer for Marked to handle code blocks
const customRenderer = new marked.Renderer();
customRenderer.code = ({ text: code, lang, escaped }: { text: string; lang?: string; escaped?: boolean }): string => {
    const codeContent = code || '';
    const language = lang || 'plaintext';

    // Basic HTML escaping, if not already done by marked
    const finalCode = escaped ? codeContent : codeContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    
    // Always return a simple <pre><code> block
    return `<pre><code class="language-${language}">${finalCode}</code></pre>`;
};

marked.use({ renderer: customRenderer });

export { marked };