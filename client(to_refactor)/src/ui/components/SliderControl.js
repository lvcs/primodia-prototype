export function SliderControl({ id, min, max, step, value, onInput, onChange }) {
  const input = document.createElement('input');
  input.type = 'range';
  if (id) input.id = id;
  input.classList.add('control-slider');
  if (min !== undefined) input.min = min;
  if (max !== undefined) input.max = max;
  if (step !== undefined) input.step = step;
  if (value !== undefined) input.value = value;
  if (onInput) input.addEventListener('input', onInput);
  if (onChange) input.addEventListener('change', onChange);
  return input;
} 