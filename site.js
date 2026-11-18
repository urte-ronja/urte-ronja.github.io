{
  // ---- Enquiry form ----
  // Free form-to-email service: get a key at https://web3forms.com (enter urteronja@proton.me),
  // paste it between the quotes below, and enquiries arrive in that inbox.
  const FORM_KEY = 'f831321b-710e-44eb-9a06-760c5bdb8a8d';  // Web3Forms public access key (safe to be in the page)
  const PREVIEW = /claudeusercontent|claude\.ai/.test(location.hostname);  // the Claude preview blocks sending

  // ---- Horizontal gallery (endless loop) ----
  // A copy of the last work sits before the first, and a copy of the first after the last.
  // Sliding onto a copy is smooth; once it settles we jump invisibly to the real work.
  const wall = document.querySelector('.wall');
  if (wall) {
    const slides = [...wall.querySelectorAll('.slide')];
    const n = slides.length;
    const pv = document.querySelector('.arr.pv'), nx = document.querySelector('.arr.nx');
    const copy = s => { const c = s.cloneNode(true); c.removeAttribute('id'); c.dataset.real = slides.indexOf(s); c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('img').forEach(i => i.loading = 'eager'); return c; };
    const headCopy = copy(slides[n - 1]), tailCopy = copy(slides[0]);
    wall.prepend(headCopy); wall.append(tailCopy);
    const all = [headCopy, ...slides, tailCopy];          // positions 0 … n+1; real work k is at k+1
    let pos = 1;
    const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // strip of small works: highlight the one on screen, keep it in view
    const strip = document.querySelector('.strip'), thumbs = strip ? [...strip.children] : [];
    const mark = p => {
      const k = (p - 1 + n) % n;
      thumbs.forEach((b, i) => { b.classList.toggle('on', i === k); b.setAttribute('aria-current', i === k ? 'true' : 'false'); });
      const b = thumbs[k];
      if (b && strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({ left: b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2, behavior: reduce() ? 'auto' : 'smooth' });
      }
    };
    const jump = p => { pos = p; wall.style.scrollSnapType = 'none'; wall.scrollLeft = all[p].offsetLeft; wall.style.scrollSnapType = ''; mark(p); };
    const slideTo = p => { pos = p; mark(p); wall.scrollTo({ left: all[p].offsetLeft, behavior: reduce() ? 'auto' : 'smooth' }); };
    thumbs.forEach((b, i) => b.addEventListener('click', () => slideTo(i + 1)));
    const settle = () => {
      const p = Math.round(wall.scrollLeft / wall.clientWidth);
      if (p === 0) jump(n); else if (p === n + 1) jump(1); else { pos = p; mark(p); }
      try { history.replaceState(null, '', '#' + slides[pos - 1].id); } catch (e) {}
    };
    let t;
    wall.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(settle, 140); }, { passive: true });

    pv.addEventListener('click', () => slideTo(Math.max(0, pos - 1)));
    nx.addEventListener('click', () => slideTo(Math.min(n + 1, pos + 1)));
    document.addEventListener('keydown', e => {
      if (document.querySelector('.eq.open, .zoom.open') || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); slideTo(Math.max(0, pos - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); slideTo(Math.min(n + 1, pos + 1)); }
    });

    // start on the first work, or the one named in the address (#witnesses)
    const named = slides.findIndex(s => '#' + s.id === location.hash);
    const begin = () => jump(named >= 0 ? named + 1 : 1);
    begin(); requestAnimationFrame(begin);
    window.addEventListener('resize', () => jump(pos));
  }

  // ---- Enquiry pop-up ----
  const box = document.querySelector('.eq');
  if (box) {
    const form = box.querySelector('form'), title = box.querySelector('.eq-t'),
          msg = form.elements.message, status = box.querySelector('.eq-s'), send = box.querySelector('.eq-send');
    let work = '';
    const close = () => box.classList.remove('open');

    document.querySelectorAll('.enq').forEach(b => b.addEventListener('click', () => {
      work = b.dataset.t;
      title.textContent = work;
      if (!msg.value || msg.dataset.auto === '1') { msg.value = `Hello, I'm interested in "${work}". `; msg.dataset.auto = '1'; }
      status.textContent = ''; status.className = 'eq-s'; send.disabled = false;
      box.classList.add('open');
      form.elements.name.focus();
    }));
    msg.addEventListener('input', () => { msg.dataset.auto = '0'; });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = form.elements;
      if (!f.name.value.trim() || !/^\S+@\S+\.\S+$/.test(f.email.value) || !f.message.value.trim()) {
        status.textContent = 'Please fill in your name, a valid email and a message.'; status.className = 'eq-s err'; return;
      }
      if (!FORM_KEY || PREVIEW) {
        status.textContent = 'This preview can’t send messages. The form will work on the live site.'; status.className = 'eq-s err'; return;
      }
      send.disabled = true; status.textContent = 'Sending…'; status.className = 'eq-s';
      try {
        const r = await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: FORM_KEY, subject: `Enquiry: ${work}`, from_name: 'urteronja website',
            name: f.name.value, email: f.email.value, work, message: f.message.value })
        });
        const j = await r.json();
        if (!j.success) throw new Error(j.message);
        status.textContent = 'Thank you, your message has been sent.'; status.className = 'eq-s ok';
        form.reset(); msg.dataset.auto = '1';
      } catch (err) {
        status.textContent = 'Sorry, that didn’t go through. Please try again in a moment.'; status.className = 'eq-s err';
        send.disabled = false;
      }
    });
    box.querySelector('.eq-x').addEventListener('click', close);
    box.addEventListener('click', e => { if (e.target === box) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // ---- Click a work to see it bigger ----
  {
    const z = document.createElement('div');
    z.className = 'zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-modal', 'true'); z.setAttribute('aria-label', 'Enlarged work');
    z.innerHTML = '<img alt=""><button type="button" aria-label="Close">\u00d7</button>';
    document.body.append(z);
    const zi = z.querySelector('img');
    const shut = () => { z.classList.remove('open'); document.body.style.overflow = ''; };
    document.querySelectorAll('.slide img').forEach(i => i.addEventListener('click', () => {
      zi.src = i.src.replace('-sm.jpg', '.jpg'); zi.alt = i.alt;  // full-size file
      z.classList.add('open'); document.body.style.overflow = 'hidden';
    }));
    z.addEventListener('click', shut);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });
  }
}
