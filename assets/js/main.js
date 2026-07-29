(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 未確定の数値を data/content.json から流し込む ──
     台帳（docs/kirari-lp-assets-ledger.md「2. 数値台帳」）と対応。
     空の項目は出さない。仮の値や「◯◯」は絶対に表示しない。
     ・給与が空 → 募集要項の給与行ごと出さない
     ・電話が空 → 電話ボタンを隠し、メールボタンが全幅になる
     ・メールが空 → メールボタンを隠し、電話ボタンが全幅になる
     ・両方空   → 固定CTAごと出さない（CTAぶんの下余白も詰める） */
  var ctaSpace = 0;
  (function(){
    var bar  = document.getElementById('ctaBar'),
        tel  = document.getElementById('ctaTel'),
        mail = document.getElementById('ctaMail'),
        row  = document.getElementById('rowSalary'),
        val  = document.getElementById('valSalary'),
        reqTel  = document.getElementById('reqTel'),
        reqMail = document.getElementById('reqMail');

    function yen(v){
      var s = (v === null || v === undefined) ? '' : String(v).replace(/[^0-9]/g, '');
      return s ? Number(s).toLocaleString('ja-JP') : '';
    }
    function apply(d){
      d = d || {};
      var s = d.salary || {}, lo = yen(s.min), hi = yen(s.max);
      if(lo && hi){
        val.textContent = '月給 ' + lo + '円 〜 ' + hi + '円';
        row.hidden = false;
      }
      var t = String(d.tel || '').trim();
      if(t){
        tel.href = 'tel:' + t.replace(/[^0-9+]/g, '');
        tel.hidden = false;
        // 募集要項には目で読める形で載せる（固定CTAはタップ前提で番号が読めないため）
        reqTel.querySelector('.req-val').textContent = t;
        reqTel.hidden = false;
      }
      var m = String(d.email || '').trim();
      if(m){
        var url = /^https?:\/\//i.test(m);
        mail.href = url ? m : 'mailto:' + m;
        mail.hidden = false;
        var box = reqMail.querySelector('.req-val');
        box.textContent = '';
        if(url){
          var a = document.createElement('a');
          a.href = m; a.textContent = m;
          box.appendChild(a);
        }else{
          box.textContent = m;
        }
        reqMail.hidden = false;
      }
      if(t || m){ bar.hidden = false; ctaSpace = 96; }
      else { document.body.classList.add('no-cta'); }
      updTl();
    }
    fetch('data/content.json', {cache:'no-cache'})
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(apply)
      .catch(function(e){
        console.warn('[kirari] data/content.json を読み込めませんでした。未確定の項目は非表示のままにします。', e);
        apply({});
      });
  })();

  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('in');
      if(e.target.classList.contains('fact')){
        setTimeout(function(){ e.target.classList.add('on'); }, 120);
      }
      io.unobserve(e.target);
    });
  },{threshold:.18});
  document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });
  if(reduce){ document.querySelectorAll('.fact').forEach(function(el){ el.classList.add('on'); }); }

  (function(){
    var lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'),
        lbTitle = document.getElementById('lbTitle'), lbText = document.getElementById('lbText');
    function close(){ lb.classList.remove('on'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }
    document.querySelectorAll('.album .pic.zoomable').forEach(function(pic){
      pic.addEventListener('click', function(){
        // 写真が未入手（プレースホルダ表示中）の枠は拡大しない
        var frame = pic.querySelector('.ph');
        if(frame && frame.classList.contains('pending')) return;
        var img = pic.querySelector('img'); if(!img) return;
        lbImg.src = img.src;
        lbTitle.textContent = pic.dataset.title || '';
        // 説明文が未記入の写真は、説明行ごと出さず見出しだけにする
        var txt = (pic.dataset.text || '').trim();
        lbText.textContent = txt;
        lbText.hidden = !txt;
        lb.classList.add('on'); lb.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
      });
    });
    document.getElementById('lbClose').addEventListener('click', close);
    lb.addEventListener('click', function(e){ if(e.target !== lbImg) close(); });
    addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
  })();

  (function(){
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq-list details'));
    items.forEach(function(d){
      var a = d.querySelector('.a');
      var inner = document.createElement('div');
      inner.className = 'a-in';
      while(a.firstChild) inner.appendChild(a.firstChild);
      a.appendChild(inner);
    });
    function shut(d){
      var a = d.querySelector('.a');
      a.style.height = a.scrollHeight + 'px';
      if(reduce){ a.style.height = '0px'; a.style.opacity = 0; d.open = false; return; }
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        a.style.height = '0px'; a.style.opacity = 0;
      }); });
      a.addEventListener('transitionend', function done(e){
        if(e.propertyName !== 'height') return;
        d.open = false; a.removeEventListener('transitionend', done);
      });
    }
    function show(d){
      var a = d.querySelector('.a');
      d.open = true;
      a.style.opacity = 1;
      if(reduce){ a.style.height = 'auto'; return; }
      var h = a.firstElementChild.offsetHeight;
      requestAnimationFrame(function(){ a.style.height = h + 'px'; });
      a.addEventListener('transitionend', function done(e){
        if(e.propertyName !== 'height') return;
        a.style.height = 'auto'; a.removeEventListener('transitionend', done);
      });
    }
    items.forEach(function(d){
      d.querySelector('summary').addEventListener('click', function(e){
        e.preventDefault();
        if(d.open){ shut(d); return; }
        items.forEach(function(o){ if(o !== d && o.open) shut(o); });
        show(d);
      });
    });
  })();

  /* ── 写真枠 ──
     どの枠に写真があるかは data/photos.json（台帳「1. 写真台帳」の状態列と1対1）が持つ。
     『済』の枠だけを、画面に近づいたときに読み込む。『未』の枠は通信もせずプレースホルダのまま
     （存在しないファイルへのリクエストを出さないため）。
     写真の追加手順 = assets/img/ に台帳のファイル名で置く ＋ photos.json のIDを『済』にする。
     ※ネイティブの loading="lazy" は使えない。プレースホルダ表示中の写真は display:none で
       「画面に入る」条件を満たさず、読み込みが永久に始まらないため（実測で確認）。 */
  (function(){
    var frames = Array.prototype.slice.call(document.querySelectorAll('.ph.shot[data-photo]'));
    if(!frames.length) return;
    var queue = [], tick = false;
    var MARGIN = 400;   // 画面の上下400pxまで近づいたら読み込む

    function pump(){
      tick = false;
      for(var i = queue.length - 1; i >= 0; i--){
        var f = queue[i], r = f.getBoundingClientRect();
        if(r.bottom < -MARGIN || r.top > innerHeight + MARGIN) continue;
        var img = f.querySelector('img[data-src]');
        if(img){ img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
        queue.splice(i, 1);
      }
      if(!queue.length) removeEventListener('scroll', onScroll);
    }
    function onScroll(){ if(!tick){ tick = true; requestAnimationFrame(pump); } }

    fetch('data/photos.json', {cache:'no-cache'})
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(d){
        var st = (d && d.photos) || {};
        queue = frames.filter(function(f){ return st[f.getAttribute('data-photo')] === '済'; });
        if(!queue.length) return;
        addEventListener('scroll', onScroll, {passive:true});
        addEventListener('resize', onScroll, {passive:true});
        pump();
      })
      .catch(function(e){
        console.warn('[kirari] data/photos.json を読み込めませんでした。写真はプレースホルダのままにします。', e);
      });
  })();

  var wio = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('seen'); wio.unobserve(e.target); } });
  },{threshold:.25});
  document.querySelectorAll('.wipe').forEach(function(el){ wio.observe(el); });
  if(reduce){ document.querySelectorAll('.wipe').forEach(function(el){ el.classList.add('seen'); }); }

  var slides = Array.prototype.slice.call(document.querySelectorAll('#stage .slide')),
      hdots = Array.prototype.slice.call(document.querySelectorAll('#dots i')), hi = 0, htimer = null;
  function hgo(n){
    hi = (n + slides.length) % slides.length;
    slides.forEach(function(s,k){ s.classList.toggle('on', k === hi); });
    hdots.forEach(function(d,k){ d.classList.toggle('on', k === hi); });
  }
  function hplay(){ clearInterval(htimer); if(!reduce) htimer = setInterval(function(){ hgo(hi+1); }, 5000); }
  hplay();
  document.addEventListener('visibilitychange', function(){ if(document.hidden) clearInterval(htimer); else hplay(); });

  var tl = document.getElementById('tl'), rail = document.getElementById('rail'),
      tlFill = document.getElementById('tlFill'), tlDot = document.getElementById('tlDot'),
      tlMascot = document.getElementById('tlMascot'),
      tlItems = Array.prototype.slice.call(tl.querySelectorAll('.tl-item')), tick1 = false;
  function updTl(){
    tick1 = false;
    if(reduce) return;
    var r = rail.getBoundingClientRect(), anchor = (innerHeight - ctaSpace) * .5;
    var p = Math.max(0, Math.min(1, (anchor - r.top) / r.height));
    tlFill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    var y = p * r.height;
    tlDot.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
    if(tlMascot) tlMascot.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
    var cur = -1;
    tlItems.forEach(function(it,i){
      var passed = y >= (it.getBoundingClientRect().top - r.top + 9);
      it.classList.toggle('lit', passed);
      if(passed) cur = i;
    });
    tlItems.forEach(function(it,i){ it.classList.toggle('now', i === cur); });
  }
  addEventListener('scroll', function(){ if(!tick1){ tick1 = true; requestAnimationFrame(updTl); } }, {passive:true});
  updTl();

  if(!reduce){
    var band = document.querySelector('.band'), bph = document.getElementById('bandPh'), tick = false;
    function move(){
      var r = band.getBoundingClientRect();
      if(r.bottom > 0 && r.top < innerHeight){
        var prog = (innerHeight - r.top) / (innerHeight + r.height);
        bph.style.transform = 'translateY(' + ((prog - .5) * 48).toFixed(1) + 'px)';
      }
      tick = false;
    }
    addEventListener('scroll', function(){ if(!tick){ tick = true; requestAnimationFrame(move); } }, {passive:true});
    move();
  }
})();
