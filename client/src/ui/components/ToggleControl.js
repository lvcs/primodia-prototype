export function ToggleControl({ id, checked = false, labelText, onChange }) {
  const wrapper = document.createElement('div');
  const input = document.createElement('input');
  input.type = 'checkbox';
  if (id) input.id = id;
  input.checked = checked;
  if (onChange) input.addEventListener('change', onChange);
  wrapper.appendChild(input);
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = ` ${labelText}`;
  wrapper.appendChild(label);
  return wrapper;
} 