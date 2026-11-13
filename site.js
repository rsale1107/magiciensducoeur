/* Les Magiciens du Cœur — scripts communes à toutes les pages */
(function () {
  /* ---- menu mobile ---- */
  var burger = document.getElementById('burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
  }

  /* ---- calculateur de don + bouton PayPal ---- */
  /* Compte PayPal de l'association : e-mail du compte ou identifiant marchand */
  var PAYPAL_COMPTE = 'lesmagiciensducoeur@gmail.com';
  var input = document.getElementById('montant');
  if (input) {
    var reel = document.getElementById('reel'), eco = document.getElementById('eco'),
        ppBtn = document.getElementById('ppBtn'), ppAmt = document.getElementById('ppAmt'), ppCfg = document.getElementById('ppCfg'),
        btns = [].slice.call(document.querySelectorAll('.amt'));
    var euro = function (n) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €'; };
    var ppLink = function (v) {
      if (!PAYPAL_COMPTE) { ppCfg.hidden = false; ppBtn.href = 'https://www.paypal.com/donate/'; return; }
      var q = 'business=' + encodeURIComponent(PAYPAL_COMPTE) + '&currency_code=EUR&item_name=' + encodeURIComponent('Don aux Magiciens du Cœur');
      if (v > 0) q += '&amount=' + encodeURIComponent(v);
      ppBtn.href = 'https://www.paypal.com/donate/?' + q;
    };
    var render = function () {
      var v = parseFloat(input.value); if (!isFinite(v) || v < 0) v = 0;
      if (v > 100000) { v = 100000; input.value = 100000; }
      var d = v * 0.66;
      reel.textContent = euro(v - d);
      eco.textContent = v > 0 ? 'Soit ' + euro(d) + ' déduits de votre impôt sur le revenu.' : 'Indiquez un montant pour voir le calcul.';
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(parseFloat(b.dataset.v) === v)); });
      ppAmt.textContent = v > 0 ? euro(v) : 'un don';
      ppLink(v);
    };
    btns.forEach(function (b) { b.addEventListener('click', function () { input.value = b.dataset.v; render(); }); });
    input.addEventListener('input', render);
    render();
  }

  /* ---- copie de l'adresse ---- */
  var cb = document.getElementById('copyAddr');
  if (cb) {
    cb.addEventListener('click', function () {
      var t = "Association Les Magiciens du Cœur\n18 rue des Ormeaux\n78340 Les Clayes-sous-Bois";
      var sel = function () {
        var r = document.createRange(); r.selectNodeContents(cb.parentNode);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        cb.textContent = 'Sélectionnée, copiez-la';
        setTimeout(function () { cb.textContent = "Copier l'adresse"; }, 2200);
      };
      var ok = function () { cb.textContent = 'Adresse copiée'; setTimeout(function () { cb.textContent = "Copier l'adresse"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, sel); else sel();
    });
  }

  /* ---- formulaire de contact ----
     Adresse e-mail de l'association : les messages y arrivent directement (service gratuit FormSubmit,
     sans compte). Au tout premier message, FormSubmit envoie un e-mail d'activation à cette adresse :
     il suffit de cliquer une fois sur le lien reçu. Si l'envoi échoue, la messagerie du visiteur
     s'ouvre avec le message déjà rédigé. Tant que l'adresse est vide, rien n'est envoyé. */
  var CONTACT_EMAIL = 'lesmagiciensducoeur@gmail.com';
  var f = document.getElementById('contactForm');
  if (f) {
    var sent = document.getElementById('sent'), err = document.getElementById('err'), cfg = document.getElementById('formCfg'),
        btn = f.querySelector('button[type="submit"]'), sentTxt = sent ? sent.querySelector('p') : null;
    if (!CONTACT_EMAIL && cfg) cfg.hidden = false;
    var val = function (id) { return document.getElementById(id).value.trim(); };
    var showErr = function (t) { err.textContent = t; err.hidden = false; };
    var done = function (msg) {
      if (sentTxt && msg) sentTxt.textContent = msg;
      f.hidden = true; sent.hidden = false; sent.setAttribute('tabindex', '-1'); sent.focus();
    };
    var viaMessagerie = function (objet, corps) {
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(objet + ' – site des Magiciens du Cœur') + '&body=' + encodeURIComponent(corps);
      done("Votre messagerie s'est ouverte avec le message rédigé : il ne reste qu'à l'envoyer. Si rien ne s'est ouvert, écrivez-nous à " + CONTACT_EMAIL + '.');
    };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = ['prenom', 'nom', 'email', 'message'].every(function (id) { return val(id) !== ''; });
      if (!ok || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) { showErr('Merci de remplir tous les champs, avec un e-mail valide.'); return; }
      err.hidden = true;
      if (!CONTACT_EMAIL) { if (cfg) { cfg.hidden = false; cfg.focus(); } return; }
      var objet = document.getElementById('objet').value;
      var corps = val('message') + '\n\n' + val('prenom') + ' ' + val('nom') + '\n' + val('email');
      if (!window.fetch) { viaMessagerie(objet, corps); return; }
      btn.disabled = true; var lib = btn.textContent; btn.textContent = 'Envoi en cours…';
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CONTACT_EMAIL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: objet + ' – site des Magiciens du Cœur',
          _replyto: val('email'), _template: 'table', _captcha: 'false',
          'Prénom': val('prenom'), 'Nom': val('nom'), 'E-mail': val('email'), 'Objet': objet, 'Message': val('message')
        })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && String(j.success) !== 'false'; }); })
        .then(function (envoye) {
          btn.disabled = false; btn.textContent = lib;
          if (envoye) done('Merci, votre message nous est bien parvenu. Nous revenons vers vous rapidement.');
          else viaMessagerie(objet, corps);
        })
        .catch(function () { btn.disabled = false; btn.textContent = lib; viaMessagerie(objet, corps); });
    });
  }
})();
