const channels = [
  {
    name: '01',
    title: 'Lido Live',
    src: 'media/videoplayback.mp4',
    filter: 'contrast(1.05) saturate(1.2)',
  },
  {
    name: '02',
    title: 'Nocturne Cruise',
    src: 'media/videoplayback.mp4',
    filter: 'contrast(1.2) saturate(0.6) hue-rotate(-20deg)',
  },
  {
    name: '03',
    title: 'Azure A.M.',
    src: 'media/videoplayback.mp4',
    filter: 'brightness(1.08) saturate(1.4) hue-rotate(30deg)',
  },
];

const video = document.getElementById('channel-video');
const staticVideo = document.getElementById('static-video');
const label = document.getElementById('channel-label');
const nextBtn = document.getElementById('next-channel');
const prevBtn = document.getElementById('prev-channel');

let current = 0;

const switchChannel = (direction = 1) => {
  current = (current + direction + channels.length) % channels.length;
  playChannel(channels[current]);
};

const playChannel = (channel) => {
  if (!video || !staticVideo || !label) return;
  label.textContent = channel.name;
  video.style.filter = channel.filter;

  staticVideo.currentTime = 0;
  staticVideo.play();
  staticVideo.classList.add('is-visible');

  video.classList.add('is-hidden');
  video.pause();

  setTimeout(() => {
    if (video.dataset.src !== channel.src) {
      video.src = channel.src;
      video.dataset.src = channel.src;
      video.load();
    } else {
      video.currentTime = 0;
    }

    video.play();
    staticVideo.pause();
    staticVideo.classList.remove('is-visible');
    video.classList.remove('is-hidden');
  }, 600);
};

nextBtn?.addEventListener('click', () => switchChannel(1));
prevBtn?.addEventListener('click', () => switchChannel(-1));

window.addEventListener('load', () => {
  if (!video) return;
  video.muted = true;
  video.loop = true;
  playChannel(channels[current]);
});

// Desktop window logic
const widgets = document.querySelectorAll('.widget');
const dockButtons = document.querySelectorAll('[data-open]');
const closeButtons = document.querySelectorAll('.widget__close');
let zIndexCursor = widgets.length + 5;

const bringToFront = (widget) => {
  widgets.forEach((panel) => panel.classList.remove('is-active'));
  widget.classList.remove('hidden');
  widget.classList.add('is-active');
  widget.style.zIndex = `${++zIndexCursor}`;
};

widgets.forEach((widget) => {
  const handle = widget.querySelector('[data-drag-handle]');
  if (!handle) return;

  const startDrag = (event) => {
    if (event.button !== 0) return;
    bringToFront(widget);
    const rect = widget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const onMove = (e) => {
      const width = widget.offsetWidth;
      const height = widget.offsetHeight;
      const maxX = window.innerWidth - width - 12;
      const maxY = window.innerHeight - height - 12;
      const nextLeft = Math.min(Math.max(e.clientX - offsetX, 8), Math.max(8, maxX));
      const nextTop = Math.min(Math.max(e.clientY - offsetY, 8 + 60), Math.max(8 + 60, maxY));
      widget.style.left = `${nextLeft}px`;
      widget.style.top = `${nextTop}px`;
      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
    };

    const endDrag = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', endDrag);
      handle.releasePointerCapture?.(event.pointerId);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endDrag);
    handle.setPointerCapture?.(event.pointerId);
  };

  handle.addEventListener('pointerdown', startDrag);
  widget.addEventListener('pointerdown', () => bringToFront(widget));
});

closeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const widget = button.closest('.widget');
    widget?.classList.add('hidden');
  });
});

dockButtons.forEach((button) => {
  const targetId = button.dataset.open;
  const target = document.getElementById(targetId);
  if (!target) return;
  button.addEventListener('click', () => {
    target.classList.remove('hidden');
    bringToFront(target);
  });
});

// Set default active window
const primaryWindow = document.getElementById('window-tv');
if (primaryWindow) {
  bringToFront(primaryWindow);
}
