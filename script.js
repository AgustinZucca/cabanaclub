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

// Auth & invite panel logic
const authOverlay = document.getElementById('auth-overlay');
const authTabs = document.querySelectorAll('[data-panel-toggle]');
const authForms = document.querySelectorAll('.auth-form');
const authStatus = document.getElementById('auth-status');
const authTriggers = document.querySelectorAll('[data-auth]');
const authCloseButtons = document.querySelectorAll('[data-auth-close]');
const inviteForm = document.getElementById('invite-form');
const loginForm = document.getElementById('login-form');
const inviteStorageKey = 'cabanaClubInvites';

const showAuthStatus = (message, isError = false) => {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.classList.toggle('is-error', Boolean(isError));
};

const setActivePanel = (panel = 'invite') => {
  authTabs.forEach((tab) => {
    const isActive = tab.dataset.panelToggle === panel;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  authForms.forEach((form) => {
    const isActive = form.dataset.panel === panel;
    form.classList.toggle('hidden', !isActive);
    if (isActive) {
      form.reset?.();
    }
  });

  showAuthStatus('');
};

const openAuthPanel = (panel = 'invite') => {
  if (!authOverlay) return;
  authOverlay.classList.remove('hidden');
  authOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-modal-open');
  setActivePanel(panel);
};

const closeAuthPanel = () => {
  if (!authOverlay) return;
  authOverlay.classList.add('hidden');
  authOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-modal-open');
  showAuthStatus('');
};

authTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const panel = trigger.dataset.auth || 'invite';
    openAuthPanel(panel);
  });
});

authCloseButtons.forEach((button) => {
  button.addEventListener('click', closeAuthPanel);
});

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setActivePanel(tab.dataset.panelToggle);
  });
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAuthPanel();
  }
});

const getInvites = () => {
  try {
    return JSON.parse(localStorage.getItem(inviteStorageKey) || '[]');
  } catch (error) {
    console.error('Unable to parse invites', error);
    return [];
  }
};

const saveInvites = (invites) => {
  localStorage.setItem(inviteStorageKey, JSON.stringify(invites));
};

const isValidEmail = (value) => /.+@.+\..+/.test(value);

inviteForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(inviteForm);
  const name = (formData.get('name') || '').toString().trim();
  const email = (formData.get('email') || '').toString().trim().toLowerCase();
  const guests = Number(formData.get('guests')) || 0;
  const arrival = (formData.get('arrival') || '').toString().trim();

  if (!name || !isValidEmail(email) || guests < 1) {
    showAuthStatus('Please share a name, valid email, and guest count.', true);
    return;
  }

  const invites = getInvites();
  const alreadyInvited = invites.find((entry) => entry.email === email);
  if (alreadyInvited) {
    showAuthStatus('You are already on the beach list—check your inbox for updates.', false);
    return;
  }

  const newInvite = {
    name,
    email,
    guests,
    arrival,
    submittedAt: new Date().toISOString(),
  };

  invites.push(newInvite);
  saveInvites(invites);
  inviteForm.reset();
  showAuthStatus(`Invite request received for ${name}. We'll confirm within 24 hours.`, false);
});

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const member = (formData.get('member') || '').toString().trim();
  const access = (formData.get('access') || '').toString().trim();

  if (member.length < 4 || access.length < 4) {
    showAuthStatus('Enter your membership ID and 4+ digit access code.', true);
    return;
  }

  showAuthStatus(`Welcome back, ${member.toUpperCase()} · lounge unlocked.`, false);
  setTimeout(() => {
    closeAuthPanel();
  }, 1800);
});
