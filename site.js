{
  // ---- Enquiry form ----
  // Free form-to-email service: get a key at https://web3forms.com (enter urteronja@proton.me),
  // paste it between the quotes below, and enquiries arrive in that inbox.
  const FORM_KEY = 'f831321b-710e-44eb-9a06-760c5bdb8a8d';  // Web3Forms public access key (safe to be in the page)
  const PREVIEW = /claudeusercontent|claude\.ai/.test(location.hostname);  // the Claude preview blocks sending

  // ---- Horizontal gallery ----
  const wall = document.querySelector('.wall');
  if (wall) {
    const slides = [...wall.querySelectorAll('.slide')];
    const count = document.querySelector('.count');
    const pv = document.querySelector('.arr.pv'), nx = document.querySelector('.arr.nx');
    let cur = 0;

    const go = (i, smooth = true) => {
      cur = (i + slides.length) % slides.length;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      wall.scrollTo({ left: slides[cur].offsetLeft, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    };
    const mark = i => {
      cur = i;
      if (count) count.textContent = `${i + 1} / ${slides.length}`;
      try { history.replaceState(null, '', '#' + slides[i].id); } catch (e) {}
    };

    // keep counter in sync with swipes / trackpad scrolling
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) mark(slides.indexOf(en.target));
    }), { root: wall, threshold: 0.6 });
    slides.forEach(s => io.observe(s));

    pv.addEventListener('click', () => go(cur - 1));
    nx.addEventListener('click', () => go(cur + 1));
    document.addEventListener('keydown', e => {
      if (document.querySelector('.eq.open') || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    });

    // open on the work named in the address (#witnesses), if any
    const start = slides.findIndex(s => '#' + s.id === location.hash);
    if (start > 0) requestAnimationFrame(() => go(start, false));
    window.addEventListener('resize', () => go(cur, false));
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
}
