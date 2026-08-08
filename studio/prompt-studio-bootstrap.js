for (const [href, marker] of [['./prompt-studio.css','promptStudioStyles'],['./prompt-studio-bridge.css','promptStudioBridgeStyles']]) {
  if (!document.querySelector(`link[data-${marker.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset[marker] = 'true';
    document.head.appendChild(link);
  }
}

await import('./prompt-studio-ui.js');
await import('./prompt-studio-source-bridge.js');
