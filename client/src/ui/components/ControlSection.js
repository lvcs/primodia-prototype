export function ControlSection({ label, children, className = '' }) {
  const section = document.createElement('div');
  section.classList.add('control-section');
  if (className) section.classList.add(...className.split(' '));

  const labelDiv = document.createElement('div');
  labelDiv.classList.add('control-label');
  labelDiv.textContent = label;
  section.appendChild(labelDiv);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('control-content');
  if (typeof children === 'string') {
    contentDiv.innerHTML = children;
  } else if (children instanceof HTMLElement) {
    contentDiv.appendChild(children);
  } else if (Array.isArray(children)) {
    children.forEach(child => contentDiv.appendChild(child));
  }
  section.appendChild(contentDiv);

  return section;
} 