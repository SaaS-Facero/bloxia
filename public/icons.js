// Icônes SVG maison (grille 24, trait 1.8). Usage : <i data-i="cube"></i> -> remplacé au chargement.
window.ICONS={
cube:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',coin:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3H14"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',cake:'<path d="M4 20h16v-7H4zM7 13V9M12 13V8M17 13V9"/>',
tool:'<path d="M14 6a4 4 0 005 5l-9 9a2 2 0 01-3-3l9-9z"/>',game:'<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M8 10v5M5.5 12.5h5M16 11h.01M18 14h.01"/>',
target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
star:'<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',key:'<circle cx="8" cy="14" r="4"/><path d="M11 11l9-8M17 6l3 3"/>',
play:'<path d="M7 4l13 8-13 8z"/>',sound:'<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 010 6"/>',mute:'<path d="M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6"/>',
code:'<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',msg:'<path d="M4 5h16v11H9l-5 4z"/>',cart:'<path d="M3 4h3l2 11h10l2-8H7"/><circle cx="9" cy="19" r="1"/><circle cx="17" cy="19" r="1"/>',
file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
snow:'<path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9"/>',fire:'<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
tree:'<path d="M12 3l6 8h-3l4 6H5l4-6H6z"/><path d="M12 17v4"/>',city:'<path d="M4 21V9h6v12M10 21V4h7v17M20 21v-8h-3M13 8h1M13 12h1M13 16h1"/>',
sand:'<path d="M2 18c4-6 8-6 12 0M10 18c3-4 6-4 10 0"/><circle cx="17" cy="7" r="2.5"/>',rocket:'<path d="M12 3c4 2 6 6 5 11l-3 3h-4l-3-3c-1-5 1-9 5-11z"/><circle cx="12" cy="10" r="1.5"/><path d="M8 17l-3 3M16 17l3 3"/>',
check:'<path d="M5 12l5 5 9-10"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',gift:'<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9c-4 0-5-5-2-5 2 0 2 3 2 5zM12 9c4 0 5-5 2-5-2 0-2 3-2 5z"/>',
shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'};
window.ic=n=>`<svg class="ic" viewBox="0 0 24 24">${ICONS[n]||''}</svg>`;
window.paintIcons=(r=document)=>r.querySelectorAll('i[data-i]').forEach(e=>{e.outerHTML=ic(e.dataset.i)});
document.addEventListener('DOMContentLoaded',()=>paintIcons());
