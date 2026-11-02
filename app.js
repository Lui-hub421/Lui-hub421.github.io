'use strict';

(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;

  // Keep all content visible when JavaScript or motion support is unavailable.
  if ('IntersectionObserver' in window && !reducedMotion) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    $$('.reveal').forEach(element => observer.observe(element));
  }

  const menuButton = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  const setMenu = open => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    mobileNav.hidden = !open;
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  window.matchMedia?.('(min-width: 768px)').addEventListener?.('change', event => {
    if (event.matches) setMenu(false);
  });

  // The interactive experience is an illustrative workspace, not a live dashboard.
  const tabs = $$('[data-demo]');
  const selectTab = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      $(`#demo-${item.dataset.demo}`).hidden = !selected;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      const target = {
        ArrowRight: (index + 1) % tabs.length,
        ArrowLeft: (index - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1
      }[event.key];
      if (target !== undefined) {
        event.preventDefault();
        selectTab(tabs[target]);
        tabs[target].focus();
      }
    });
  });

  const dialogs = $$('dialog');
  const dialogOrigins = new WeakMap();
  const showDialog = (dialog, trigger) => {
    setMenu(false);
    dialogs.forEach(openDialog => { if (openDialog.open) openDialog.close(); });
    dialogOrigins.set(dialog, trigger || document.activeElement);
    dialog.showModal();
    document.body.classList.add('modal-open');
    dialog.scrollTop = 0;
  };
  dialogs.forEach(dialog => {
    $('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      if (!dialogs.some(item => item.open)) {
        document.body.classList.remove('modal-open');
        dialogOrigins.get(dialog)?.focus();
      }
    });
  });

  const briefDialog = $('#brief-dialog');
  const briefForm = $('#brief-form');
  const formView = $('#brief-form-view');
  const resultView = $('#brief-result-view');
  const resultText = $('#brief-result');
  const statusText = $('#copy-status');
  const openBrief = (service, trigger) => {
    formView.hidden = false;
    resultView.hidden = true;
    briefDialog.setAttribute('aria-labelledby', 'brief-title');
    statusText.textContent = '';
    if (service) $('#brief-service').value = service;
    else if (!$('#brief-name').value) $('#brief-service').value = 'Todavía estoy explorando';
    showDialog(briefDialog, trigger);
  };
  $$('[data-brief]').forEach(button => button.addEventListener('click', () => openBrief(button.dataset.brief, button)));

  briefForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = briefForm.elements.namedItem('name');
    const idea = briefForm.elements.namedItem('idea');
    name.setCustomValidity(name.value.trim() ? '' : 'Escribe tu nombre.');
    idea.setCustomValidity(idea.value.trim().length >= 15 ? '' : 'Cuéntame tu idea con al menos 15 caracteres.');
    if (!briefForm.reportValidity()) return;
    const fields = new FormData(briefForm);
    const get = key => String(fields.get(key) || '').trim();
    resultText.value = [
      'Hola, Luis. Me gustaría conversar sobre un proyecto con LT Soft & Systems.',
      '',
      `Mi nombre: ${get('name')}`,
      get('company') ? `Empresa o marca: ${get('company')}` : '',
      `Servicio: ${get('service')}`,
      `Cuándo me gustaría empezar: ${get('timing')}`,
      get('contact') ? `Mi contacto: ${get('contact')}` : '',
      '',
      'Mi idea:',
      get('idea'),
      '',
      'Quisiera conocer los siguientes pasos y recibir una propuesta.'
    ].filter((line, index, lines) => line !== '' || (index > 0 && lines[index - 1] !== '')).join('\n');
    // Build links only after the completed consultation has passed validation.
    $('#send-whatsapp').href = 'https://wa.me/51987879692?text=' + encodeURIComponent(resultText.value);
    const subject = 'Consulta web LT Soft & Systems · ' + get('service');
    const emailBody = resultText.value.replace(/\r?\n/g, '\r\n');
    $('#send-email').href = 'mailto:ldluistello@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(emailBody);
    formView.hidden = true;
    resultView.hidden = false;
    briefDialog.setAttribute('aria-labelledby', 'brief-result-title');
    statusText.textContent = '';
    $('#copy-brief').innerHTML = '<svg><use href="#i-copy"/></svg> Copiar mensaje';
    briefDialog.scrollTop = 0;
    $('#send-whatsapp').focus();
  });
  ['name', 'idea'].forEach(key => {
    const field = briefForm.elements.namedItem(key);
    field.addEventListener('input', () => field.setCustomValidity(''));
  });

  $('#edit-brief').addEventListener('click', () => {
    resultView.hidden = true;
    formView.hidden = false;
    briefDialog.setAttribute('aria-labelledby', 'brief-title');
    briefDialog.scrollTop = 0;
    $('#brief-idea').focus();
  });

  $('#copy-brief').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    let copied = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(resultText.value);
      copied = true;
    } catch {
      resultText.focus();
      resultText.select();
      resultText.setSelectionRange(0, resultText.value.length);
      try { copied = document.execCommand('copy'); } catch { copied = false; }
    }
    if (copied) {
      button.innerHTML = '<svg><use href="#i-check"/></svg> Mensaje copiado';
      statusText.textContent = 'Copiado. Puedes pegarlo en tu conversación con Luis.';
    } else {
      statusText.textContent = 'Selecciona y copia el texto con Ctrl+C, ⌘C o la opción Copiar de tu dispositivo.';
    }
    button.disabled = false;
  });

  $('#download-brief').addEventListener('click', () => {
    const file = new Blob(['\uFEFF' + resultText.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mi-proyecto-lt-soft-systems.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    statusText.textContent = 'Se ha preparado la descarga de tu consulta.';
  });

  const projects = {
    ers: {
      client: 'ERS ENTRENAMIENTO · DESARROLLO WEB',
      title: 'Inscripciones y certificados, conectados.',
      description: 'Una plataforma para organizar la capacitación y centralizar la información de empresas, participantes y cursos.',
      challenge: 'Reunir en un mismo flujo la programación de cursos, las inscripciones, el control de cupos y la emisión de certificados.',
      features: [
        'Gestión de empresas, cursos, sesiones e instructores.',
        'Inscripción de participantes y carga de información desde Excel.',
        'Interfaces para administración, clientes, facturación e instructores.',
        'Filtros, reportes y descarga de certificados según su estado.'
      ],
      service: 'Software a medida'
    },
    bm: {
      client: 'BM SOLUCIONES INTEGRALES · SITIO CORPORATIVO',
      title: 'Una presencia digital que presenta toda la empresa.',
      description: 'Sitio web corporativo para BM Soluciones Integrales Cajamarca, con información de la empresa, sus servicios y sus proyectos.',
      challenge: 'Organizar la información de la empresa en una experiencia clara que permita conocer su trabajo desde cualquier dispositivo.',
      features: [
        'Presentación de la empresa, misión y visión.',
        'Secciones de especialidades y alquiler de equipos.',
        'Galería, responsabilidad social e información del taller.',
        'Ubicación, contacto y diseño adaptable a celulares.'
      ],
      service: 'Página web'
    },
    dicesa: {
      client: 'DICESA · PROYECTO DE INNOVACIÓN',
      title: 'Asistencia con ubicación y evidencia.',
      description: 'Proyecto web y móvil de control de asistencia geolocalizada, desarrollado como propuesta de innovación para DICESA.',
      challenge: 'Digitalizar los registros manuales y facilitar el seguimiento del personal, incluyendo a quienes trabajan en campo.',
      features: [
        'Registro de ingreso y salida desde una aplicación móvil.',
        'Evidencia fotográfica y ubicación GPS del registro.',
        'Panel web para gestionar empleados y consultar asistencias.',
        'Mapa de registros y reportes por rango de fechas.'
      ],
      service: 'Software a medida'
    }
  };
  const projectDialog = $('#project-dialog');
  let currentProject = null;
  let projectTrigger = null;
  $$('[data-project]').forEach(button => button.addEventListener('click', () => {
    currentProject = projects[button.dataset.project];
    if (!currentProject) return;
    projectTrigger = button;
    $('#project-dialog-client').textContent = currentProject.client;
    $('#project-dialog-title').textContent = currentProject.title;
    $('#project-dialog-description').textContent = currentProject.description;
    $('#project-dialog-challenge').textContent = currentProject.challenge;
    const list = $('#project-dialog-features');
    list.replaceChildren(...currentProject.features.map(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      return li;
    }));
    showDialog(projectDialog, button);
  }));
  $('#similar-project').addEventListener('click', () => {
    if (currentProject) openBrief(currentProject.service, projectTrigger);
  });
  $('#privacy-button').addEventListener('click', event => showDialog($('#privacy-dialog'), event.currentTarget));

  // Keep the FAQ concise while preserving native keyboard and screen-reader support.
  $$('.faq details').forEach(detail => detail.addEventListener('toggle', () => {
    if (detail.open) $$('.faq details').forEach(other => { if (other !== detail) other.open = false; });
  }));

  $('#year').textContent = String(new Date().getFullYear());
})();
