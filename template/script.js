/* =========================================================
   HIPOLEM Bâtiment - script.js
   Toutes les interactions front du site one-page :
     1. Menu burger (mobile)
     2. Header sticky : ombre au scroll
     3. Filtres de la galerie réalisations
     4. Animations d'apparition au scroll (.reveal)
     5. Validation et envoi du formulaire de contact
     6. Année dynamique dans le footer
   ========================================================= */

(() => {
  'use strict';

  /* -----------------------------------------------------------------
     1. MENU BURGER (mobile)
     ----------------------------------------------------------------- */
  const burger = document.getElementById('burger');
  const nav    = document.getElementById('mainNav');

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      // Empêche le scroll du body quand le menu mobile est ouvert
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Fermeture du menu mobile au clic sur un lien interne
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });

    // Fermeture si la fenêtre repasse en desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 880 && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* -----------------------------------------------------------------
     2. HEADER : ombre au scroll
     ----------------------------------------------------------------- */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* -----------------------------------------------------------------
     3. GALERIE : filtres par catégorie
     ----------------------------------------------------------------- */
  const filters = document.querySelectorAll('.gallery__filters .filter');
  const tiles   = document.querySelectorAll('.gallery__grid .tile');

  if (filters.length && tiles.length) {
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // État actif
        filters.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        // Affichage / masquage
        tiles.forEach(tile => {
          const cat = tile.dataset.cat;
          const show = (filter === 'all') || (cat === filter);
          tile.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  /* -----------------------------------------------------------------
     3b. GALERIE : lightbox (zoom plein écran sur les images)
         - Clic sur une tuile → ouverture
         - Flèches gauche/droite + clavier (← →) pour naviguer
         - ESC, clic en dehors, ou bouton × pour fermer
         - Respecte les filtres actifs (navigue uniquement entre tuiles visibles)
     ----------------------------------------------------------------- */
  if (tiles.length) {
    // Construire la lightbox une seule fois et l'insérer dans le body
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-hidden', 'true');
    lb.setAttribute('aria-label', 'Aperçu plein écran');
    lb.innerHTML = ''
      + '<button class="lightbox__close" type="button" aria-label="Fermer">&times;</button>'
      + '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Image précédente">&#8249;</button>'
      + '<figure class="lightbox__figure">'
      + '  <img class="lightbox__img" alt="" />'
      + '  <figcaption class="lightbox__caption"></figcaption>'
      + '</figure>'
      + '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Image suivante">&#8250;</button>'
      + '<span class="lightbox__counter" aria-hidden="true"></span>';
    document.body.appendChild(lb);

    const lbImg     = lb.querySelector('.lightbox__img');
    const lbCap     = lb.querySelector('.lightbox__caption');
    const lbCounter = lb.querySelector('.lightbox__counter');
    const closeBtn  = lb.querySelector('.lightbox__close');
    const prevBtn   = lb.querySelector('.lightbox__nav--prev');
    const nextBtn   = lb.querySelector('.lightbox__nav--next');

    let visibleTiles = [];
    let currentIndex = 0;
    let lastFocused  = null;

    function getVisibleTiles() {
      return Array.from(tiles).filter(t => !t.classList.contains('is-hidden'));
    }

    function showImage() {
      const tile = visibleTiles[currentIndex];
      if (!tile) return;
      const img = tile.querySelector('img');
      const cap = tile.querySelector('figcaption');

      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      lbCap.textContent = cap ? cap.textContent : '';

      const showNav = visibleTiles.length > 1;
      prevBtn.hidden = !showNav;
      nextBtn.hidden = !showNav;
      lbCounter.textContent = showNav
        ? (currentIndex + 1) + ' / ' + visibleTiles.length
        : '';
    }

    function openLightbox(tileIdx) {
      visibleTiles = getVisibleTiles();
      const clicked = tiles[tileIdx];
      const idxInVisible = visibleTiles.indexOf(clicked);
      currentIndex = idxInVisible >= 0 ? idxInVisible : 0;

      lastFocused = document.activeElement;
      showImage();
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      closeBtn.focus();
    }

    function closeLightbox() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      // Libère la mémoire de l'image affichée et rend le focus
      lbImg.src = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    function prevImage() {
      if (visibleTiles.length < 2) return;
      currentIndex = (currentIndex - 1 + visibleTiles.length) % visibleTiles.length;
      showImage();
    }

    function nextImage() {
      if (visibleTiles.length < 2) return;
      currentIndex = (currentIndex + 1) % visibleTiles.length;
      showImage();
    }

    // Clic sur une tuile → ouvre la lightbox
    tiles.forEach((tile, idx) => {
      tile.addEventListener('click', () => openLightbox(idx));
      // Accessibilité clavier : Entrée / Espace pour activer
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('role', 'button');
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(idx);
        }
      });
    });

    // Ferme en cliquant sur le fond (en dehors de l'image)
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lightbox__figure')) {
        closeLightbox();
      }
    });
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });

    // Navigation clavier globale (uniquement quand la lightbox est ouverte)
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      switch (e.key) {
        case 'Escape':    closeLightbox(); break;
        case 'ArrowLeft': prevImage();     break;
        case 'ArrowRight':nextImage();     break;
      }
    });

    // Support tactile : swipe gauche/droite
    let touchStartX = 0;
    lb.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 50) {
        dx < 0 ? nextImage() : prevImage();
      }
    }, { passive: true });
  }

  /* -----------------------------------------------------------------
     4. ANIMATIONS D'APPARITION AU SCROLL
        On ajoute la classe .reveal aux blocs intéressants,
        puis on les révèle progressivement via IntersectionObserver.
     ----------------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.section__header, .card, .mini-card, .review, .timeline__step, ' +
    '.tile, .features-list li, .check, .hero__content, .hero__media'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => io.observe(el));
  } else {
    // Fallback : tout afficher immédiatement
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* -----------------------------------------------------------------
     5. FORMULAIRE DE CONTACT
        - Validation rapide côté client
        - Affichage d'un message de confirmation
        - Pour activer un vrai envoi, voir commentaire <form> dans index.html
     ----------------------------------------------------------------- */
  const form     = document.querySelector('.form');
  const feedback = document.getElementById('formFeedback');

  if (form && feedback) {
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      feedback.classList.remove('is-error');
      feedback.textContent = '';

      const data = new FormData(form);
      const nom    = (data.get('nom')        || '').toString().trim();
      const tel    = (data.get('telephone')  || '').toString().trim();
      const email  = (data.get('email')      || '').toString().trim();
      const projet = (data.get('projet')     || '').toString().trim();

      // Validations simples
      if (nom.length < 2) {
        feedback.classList.add('is-error');
        feedback.textContent = 'Merci d\'indiquer votre nom.';
        return;
      }
      if (!/^[\d +().\-]{8,}$/.test(tel)) {
        feedback.classList.add('is-error');
        feedback.textContent = 'Merci d\'indiquer un téléphone valide.';
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        feedback.classList.add('is-error');
        feedback.textContent = 'L\'adresse email semble incorrecte.';
        return;
      }
      if (!projet) {
        feedback.classList.add('is-error');
        feedback.textContent = 'Merci de sélectionner un type de projet.';
        return;
      }

      // Si l'email est renseigné, on l'utilise comme reply-to (champ caché)
      const replyto = document.getElementById('replyto-hidden');
      if (replyto) replyto.value = email || '';

      // Vérifie que l'identifiant Formspree a bien été remplacé
      if (form.action.includes('VOTRE_ID_FORMSPREE')) {
        feedback.classList.add('is-error');
        feedback.textContent = 'Le formulaire n\'est pas encore configuré. Merci d\'appeler le 06 15 69 08 71.';
        return;
      }

      // Désactive le bouton pendant l'envoi
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Envoi en cours…';
      }

      // Envoi AJAX vers Formspree (ou tout endpoint compatible JSON)
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(response => {
          if (response.ok) {
            feedback.textContent = 'Merci ! Votre demande a bien été reçue, nous vous rappellerons rapidement.';
            form.reset();
          } else {
            return response.json().then(payload => {
              const errMsg = (payload && payload.errors && payload.errors[0] && payload.errors[0].message)
                || 'Une erreur est survenue, merci de nous appeler au 06 15 69 08 71.';
              feedback.classList.add('is-error');
              feedback.textContent = errMsg;
            });
          }
        })
        .catch(() => {
          feedback.classList.add('is-error');
          feedback.textContent = 'Connexion impossible. Veuillez réessayer ou nous appeler au 06 15 69 08 71.';
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText || 'Être rappelé';
          }
        });
    });
  }

  /* -----------------------------------------------------------------
     6. ANNÉE DYNAMIQUE
     ----------------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
