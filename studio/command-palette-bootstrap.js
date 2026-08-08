const existing = document.querySelector('link[data-command-palette-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './command-palette.css';
  link.dataset.commandPaletteStyles = 'true';
  document.head.appendChild(link);
}

await import('./command-palette-ui.js');

document.addEventListener('click', event => {
  const chip = event.target.closest('[data-command-prefix]');
  if (!chip) return;
  const input = document.querySelector('#globalCommandSearch');
  if (!input) return;
  const prefix = chip.dataset.commandPrefix;
  const current = String(input.value || '').trim();
  const withoutPrefix = /^[>#@]/.test(current) ? current.slice(1).trimStart() : current;
  input.value = `${prefix}${withoutPrefix}`;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
});
