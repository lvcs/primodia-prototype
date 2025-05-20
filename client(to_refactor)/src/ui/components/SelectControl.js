export function SelectControl({ id, options = [], value, onChange }) {
  const select = document.createElement('select');
  if (id) select.id = id;
  select.classList.add('control-select');
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (value !== undefined && opt.value === value) option.selected = true;
    select.appendChild(option);
  });
  if (onChange) select.addEventListener('change', onChange);
  return select;
} 