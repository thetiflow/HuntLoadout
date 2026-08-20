(function () {
  "use strict";

  var D = window.HUNT_DATA;
  var ESTADO = {
    opcoes: {
      dual: false,
      duplicados: false,
      muniCustom: false,
      soArmas: false,
      soBase: false,
      raras: false,
      quartermaster: false,
      forcaMedkit: true,
      rank: 1,
      limitePreco: 1200
    },
    slots: [],
    trancados: {},
    animando: false
  };

  var TIPOS_SLOT = {
    armaFlexivel: { etiqueta: "Weapon", tipo: "arma", slotArma: "qualquer" },
    equipamento: { etiqueta: "Equipment", tipo: "equipamento" }
  };

  var RE_DUPLA = /^(springfield|martini|sparks|berthier|romero|crossbow|bomblance|bomblauncher|nitro|lemat)/;
  D.armas.forEach(function (a) { if (RE_DUPLA.test(a.id)) a.dupla = true; });

  var PESOS_MUNICAO = {
    shell: { preferidos: ["Standard", "Slug"], chancePreferidos: 0.6 }
  };

  var NOMES_LOADOUT = [
    "The Iron Promise", "Sinner's Bargain", "Bury Them Quiet", "The Long Night",
    "Gunpowder Psalm", "Mud & Blood", "Last Candle", "The Bounty Road",
    "Grave Matter", "Torn Contract", "Devil's Dozen", "Whiskey & Wax",
    "Burning Ledger", "The Reckoning", "Salt & Smoke", "The 1896 Gospel"
  ];

  var FRASES_DESTINO = [
    "The bayou decides. You simply carry.",
    "Fortune favors the prepared — and the paranoid.",
    "Every contract is a promise written in gunpowder.",
    "Darkness is just the hunt taking cover.",
    "Carry light, or carry everything twice.",
    "The Devil deals, but you pick the cards.",
    "Some nights the swamp feeds on hunters.",
    "Three shots left is a whole plan."
  ];

  function destinoAtualizar() {
    var elNome = document.getElementById("destino-nome");
    var elFrase = document.getElementById("destino-frase");
    if (elNome) elNome.textContent = NOMES_LOADOUT[Math.floor(Math.random() * NOMES_LOADOUT.length)];
    if (elFrase) elFrase.textContent = FRASES_DESTINO[Math.floor(Math.random() * FRASES_DESTINO.length)];
  }

  var audioCtx = null;
  var ruidoBuf = null;
  var audioPronto = false;
  var somLigado = true;

  document.addEventListener("click", function () { audioPronto = true; }, { capture: true, once: true });

  function ligarBotaoSom() {
    try {
      var guardado = localStorage.getItem("hunt_som");
      if (guardado === "0") somLigado = false;
    } catch (e) {}
    aplicarSom();
    var btn = document.getElementById("btn-som");
    if (btn) btn.addEventListener("click", function () {
      somLigado = !somLigado;
      try { localStorage.setItem("hunt_som", somLigado ? "1" : "0"); } catch (e) {}
      aplicarSom();
    });
  }

  function aplicarSom() {
    var btn = document.getElementById("btn-som");
    if (btn) btn.setAttribute("aria-label", somLigado ? "Mute sound" : "Enable sound");
    if (somLigado) document.body.classList.remove("som-off");
    else document.body.classList.add("som-off");
  }

  function tocarSelo() {
    try {
      if (!audioPronto || !somLigado) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) {
        audioCtx = new AC();
        var len = audioCtx.sampleRate;
        ruidoBuf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        var dados = ruidoBuf.getChannelData(0);
        for (var i = 0; i < len; i++) dados[i] = Math.random() * 2 - 1;
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume().then(function () { tocarSelo(); });
        return;
      }
      if (audioCtx.state !== "running" || !ruidoBuf) return;
      var agora = audioCtx.currentTime;

      var thud = audioCtx.createBufferSource();
      thud.buffer = ruidoBuf;
      var filtroThud = audioCtx.createBiquadFilter();
      filtroThud.type = "lowpass";
      filtroThud.frequency.setValueAtTime(900, agora);
      filtroThud.frequency.exponentialRampToValueAtTime(120, agora + 0.09);
      var ganhoThud = audioCtx.createGain();
      ganhoThud.gain.setValueAtTime(0.0001, agora);
      ganhoThud.gain.exponentialRampToValueAtTime(0.7, agora + 0.008);
      ganhoThud.gain.exponentialRampToValueAtTime(0.0001, agora + 0.12);
      thud.connect(filtroThud).connect(ganhoThud).connect(audioCtx.destination);
      thud.start(agora);
      thud.stop(agora + 0.15);

      var osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, agora);
      osc.frequency.exponentialRampToValueAtTime(55, agora + 0.09);
      var ganhoOsc = audioCtx.createGain();
      ganhoOsc.gain.setValueAtTime(0.0001, agora);
      ganhoOsc.gain.exponentialRampToValueAtTime(0.5, agora + 0.008);
      ganhoOsc.gain.exponentialRampToValueAtTime(0.0001, agora + 0.11);
      osc.connect(ganhoOsc).connect(audioCtx.destination);
      osc.start(agora);
      osc.stop(agora + 0.12);

      for (var j = 0; j < 5; j++) {
        var atraso = 0.03 + Math.random() * 0.08;
        var crack = audioCtx.createBufferSource();
        crack.buffer = ruidoBuf;
        var filtroCrack = audioCtx.createBiquadFilter();
        filtroCrack.type = "bandpass";
        filtroCrack.frequency.value = 1800 + Math.random() * 2500;
        filtroCrack.Q.value = 4;
        var ganhoCrack = audioCtx.createGain();
        ganhoCrack.gain.setValueAtTime(0.0001, agora + atraso);
        ganhoCrack.gain.exponentialRampToValueAtTime(0.12 + Math.random() * 0.1, agora + atraso + 0.005);
        ganhoCrack.gain.exponentialRampToValueAtTime(0.0001, agora + atraso + 0.04 + Math.random() * 0.05);
        crack.connect(filtroCrack).connect(ganhoCrack).connect(audioCtx.destination);
        crack.start(agora + atraso);
        crack.stop(agora + atraso + 0.1);
      }
    } catch (e) {}
  }

  function tocarRevelacao() {
    try {
      if (!audioPronto || !somLigado || !audioCtx) return;
      if (audioCtx.state === "suspended") {
        audioCtx.resume().then(function () { tocarRevelacao(); });
        return;
      }
      if (audioCtx.state !== "running") return;
      var agora = audioCtx.currentTime;
      var notas = [
        { f: 110,    t: 0,    g: 0.13, d: 0.6 },
        { f: 138.59, t: 0.13, g: 0.13, d: 0.6 },
        { f: 164.81, t: 0.26, g: 0.13, d: 0.6 },
        { f: 220,    t: 0.39, g: 0.21, d: 1.0 }
      ];
      notas.forEach(function (n) {
        var o = audioCtx.createOscillator();
        o.type = "triangle";
        o.frequency.value = n.f;
        var g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, agora + n.t);
        g.gain.exponentialRampToValueAtTime(n.g, agora + n.t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, agora + n.t + n.d);
        o.connect(g).connect(audioCtx.destination);
        o.start(agora + n.t);
        o.stop(agora + n.t + n.d + 0.05);

        var o2 = audioCtx.createOscillator();
        o2.type = "sine";
        o2.frequency.value = n.f * 2;
        var g2 = audioCtx.createGain();
        g2.gain.setValueAtTime(0.0001, agora + n.t);
        g2.gain.exponentialRampToValueAtTime(n.g * 0.3, agora + n.t + 0.015);
        g2.gain.exponentialRampToValueAtTime(0.0001, agora + n.t + n.d * 0.7);
        o2.connect(g2).connect(audioCtx.destination);
        o2.start(agora + n.t);
        o2.stop(agora + n.t + n.d * 0.7 + 0.05);
      });
    } catch (e) {}
  }

  function capacidadeTotal() {
    return ESTADO.opcoes.quartermaster ? 6 : 5;
  }

  function construirSlots() {
    var slots = [];
    slots.push(criarSlot("armaFlexivel", "Weapon 1"));
    slots.push(criarSlot("armaFlexivel", "Weapon 2"));
    if (!ESTADO.opcoes.soArmas) {
      for (var i = 1; i <= 6; i++) slots.push(criarSlot("equipamento", "Equipment " + i));
    }
    return slots;
  }

  function criarSlot(tipo, nome) {
    return { tipo: tipo, nome: nome, item: null, municao: null, municao2: null };
  }

  function ehBase(itemId) {
    var base = true;
    for (var i = 0; i < D.armas.length; i++) {
      if (D.armas[i].variantes.indexOf(itemId) !== -1) { base = false; break; }
    }
    return base;
  }

  function armasMelee() {
    return D.armas.filter(function (a) { return a.municoes && a.municoes.length === 0; });
  }

  function ehMelee(item) {
    return item && ((item.municoes && item.municoes.length === 0) || item.tipo === "melee");
  }

  function poolDisponivel(tipo) {
    var pool;
    if (tipo === "arma") {
      pool = D.armas.slice();
      if (!ESTADO.opcoes.raras) pool = pool.filter(function (a) { return !a.raro; });
      if (ESTADO.opcoes.soBase) pool = pool.filter(function (a) { return ehBase(a.id); });
    } else if (tipo === "equipamento") {
      pool = D.ferramentas.concat(D.consumiveis).slice();
    } else {
      pool = D.ferramentas.concat(D.consumiveis).slice();
    }
    pool = pool.filter(function (a) { return a.desbloqueio <= ESTADO.opcoes.rank; });
    return pool;
  }

  function custoAtual() {
    var total = 0;
    ESTADO.slots.forEach(function (s) { if (s.item) total += s.item.preco; });
    return total;
  }

  function menorPrecoPool(pool) {
    var min = Infinity;
    pool.forEach(function (a) { if (a.preco < min) min = a.preco; });
    return min === Infinity ? 0 : min;
  }

  function orcamentoPorSlot(indice, ignorar) {
    var usado = 0;
    ESTADO.slots.forEach(function (s, i) {
      if (i === ignorar) return;
      if (s.item) usado += s.item.preco;
    });
    return ESTADO.opcoes.limitePreco - usado;
  }

  function escolherItem(pool, ignorarIds, orcamento) {
    var elegiveis = pool.filter(function (a) {
      if (ignorarIds.indexOf(a.id) !== -1) return false;
      if (orcamento !== null && orcamento !== undefined && a.preco > orcamento) return false;
      return true;
    });
    if (!elegiveis.length) return null;
    return elegiveis[Math.floor(Math.random() * elegiveis.length)];
  }

  function escolherMunicaoPonderada(item, excluir) {
    var opcoes = [];
    if (!item || !item.municoes) return null;
    item.municoes.forEach(function (m) {
      if (excluir && excluir.indexOf(m) !== -1) return;
      opcoes.push(m);
    });
    if (!opcoes.length) return null;
    var config = PESOS_MUNICAO[familiaMunicao(item, opcoes[0])];
    if (!config) {
      return opcoes[Math.floor(Math.random() * opcoes.length)];
    }
    var preferidos = [];
    var resto = [];
    opcoes.forEach(function (m) {
      if (config.preferidos.indexOf(m) !== -1) preferidos.push(m);
      else resto.push(m);
    });
    if (preferidos.length && (Math.random() < config.chancePreferidos || !resto.length)) {
      return preferidos[Math.floor(Math.random() * preferidos.length)];
    }
    return resto.length ? resto[Math.floor(Math.random() * resto.length)] : preferidos[0];
  }

  function escolherMunicaoUnica(item) {
    if (!item || !item.municoes || !item.municoes.length) return null;
    if (ESTADO.opcoes.muniCustom) {
      return item.municoes.indexOf("Standard") !== -1 ? "Standard" : item.municoes[0];
    }
    return escolherMunicaoPonderada(item, null);
  }

  function escolherMunicoes(item) {
    if (!item || !item.municoes || !item.municoes.length) return [];
    if (!item.dupla) return [escolherMunicaoUnica(item)];
    var familias = municoesPorFamilia(item);
    if (familias.length >= 2) {
      var resultado = [];
      familias.forEach(function (g) {
        if (ESTADO.opcoes.muniCustom) {
          if (g.indexOf("Standard") !== -1) resultado.push("Standard");
        } else {
          var sub = { municoes: g, municao: item.municao };
          resultado.push(escolherMunicaoPonderada(sub, null));
        }
      });
      return resultado;
    }
    var lista = item.municoes;
    if (ESTADO.opcoes.muniCustom) {
      return lista.indexOf("Standard") !== -1 ? ["Standard"] : [];
    }
    if (lista.length >= 2) {
      var subItem = { municoes: lista, municao: item.municao };
      var primeira = escolherMunicaoPonderada(subItem, null);
      var segunda = escolherMunicaoPonderada(subItem, [primeira]);
      return [primeira, segunda];
    }
    return lista.length ? [lista[0]] : [];
  }

  function aplicarMunicoes(slot, item) {
    slot.item = item;
    var sel = escolherMunicoes(item);
    slot.municao = sel.length ? sel[0] : null;
    slot.municao2 = sel.length > 1 ? sel[1] : null;
    return slot;
  }

  function reconciliarMunicoes(slot, item) {
    var sel = escolherMunicoes(item);
    var atuais = [slot.municao, slot.municao2];
    atuais.forEach(function (m, i) {
      if (m && i < sel.length && sel.indexOf(m) === -1 && item.municoes.indexOf(m) !== -1) sel[i] = m;
    });
    slot.municao = sel.length ? sel[0] : null;
    slot.municao2 = sel.length > 1 ? sel[1] : null;
  }

  function idsUsadosFC() {
    var ids = [];
    ESTADO.slots.forEach(function (s) {
      if (s.tipo === "equipamento" && s.item) ids.push(s.item.id);
    });
    return ids;
  }

  function poolCapacidade(pool, indice) {
    var soma = 0;
    ESTADO.slots.forEach(function (s, i) {
      if (i !== indice && s.item && TIPOS_SLOT[s.tipo].tipo === "arma") soma += (s.item.tamanho || 1);
    });
    var restante = capacidadeTotal() - soma;
    if (restante <= 0) return [];
    return pool.filter(function (a) { return (a.tamanho || 1) <= restante; });
  }

  function idsExcluirComLimites(permitirMedkit) {
    var ids = [];
    var contagem = {};
    var nExplosivos = 0;
    ESTADO.slots.forEach(function (s) {
      if (s.tipo === "equipamento" && s.item) {
        if (!contagem[s.item.id]) contagem[s.item.id] = 0;
        contagem[s.item.id]++;
        if (s.item.tipo === "explosivo") nExplosivos++;
      }
    });
    armasMelee().forEach(function (m) { if (ids.indexOf(m.id) === -1) ids.push(m.id); });
    D.ferramentas.forEach(function (f) {
      if (f.tipo === "melee" && (contagem[f.id] || 0) >= 1 && ids.indexOf(f.id) === -1) ids.push(f.id);
    });
    if ((contagem["spyglass"] || 0) >= 1 && ids.indexOf("spyglass") === -1) ids.push("spyglass");
    if ((contagem["beartrap"] || 0) >= 1 && ids.indexOf("beartrap") === -1) ids.push("beartrap");
    if (nExplosivos >= 2) {
      D.ferramentas.concat(D.consumiveis).forEach(function (c) {
        if (c.tipo === "explosivo" && ids.indexOf(c.id) === -1) ids.push(c.id);
      });
    }
    if (!permitirMedkit) {
      var mk = pegarPorId("medkit", "ferramentas");
      if (mk && ids.indexOf(mk.id) === -1) ids.push(mk.id);
    }
    return ids;
  }

  function idsExcluirSemDuplicados(permitirMedkit) {
    var ids = idsUsadosFC();
    idsExcluirComLimites(permitirMedkit).forEach(function (id) {
      if (ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  function poolSemFiltro(tipo) {
    var pool = D.ferramentas.concat(D.consumiveis).slice();
    pool = pool.filter(function (a) { return a.desbloqueio <= ESTADO.opcoes.rank; });
    return pool;
  }

  function gerarSlot(slot, posEquipamento) {
    var cfg = TIPOS_SLOT[slot.tipo];
    var tipo = cfg.tipo;
    if (tipo === "arma") {
      var indice = ESTADO.slots.indexOf(slot);
      var pool = poolDisponivel("arma");
      pool = poolCapacidade(pool, indice);
      if (!ESTADO.opcoes.duplicados) {
        var usados = [];
        ESTADO.slots.forEach(function (s) { if (s.item && TIPOS_SLOT[s.tipo].tipo === "arma") usados.push(s.item.id); });
        pool = pool.filter(function (a) { return usados.indexOf(a.id) === -1; });
      }
      var orc = orcamentoPorSlot(ESTADO.slots.indexOf(slot));
      aplicarMunicoes(slot, escolherItem(pool, [], orc));
    } else {
      var p2 = poolDisponivel("equipamento");
      var orc2 = orcamentoPorSlot(ESTADO.slots.indexOf(slot));
      if (ESTADO.opcoes.forcaMedkit && posEquipamento === 1) {
        var mk = pegarPorId("medkit", "ferramentas");
        if (mk && mk.preco <= orc2) slot.item = mk;
        else {
          var permitirMedkit = !ESTADO.opcoes.forcaMedkit;
          var exclSemDup = idsExcluirSemDuplicados(permitirMedkit);
          slot.item = escolherItem(p2, exclSemDup, orc2);
          if (!slot.item) slot.item = escolherItem(poolSemFiltro("equipamento"), exclSemDup, orc2);
          if (!slot.item) {
            var exclRep = idsExcluirComLimites(permitirMedkit);
            slot.item = escolherItem(p2, exclRep, orc2);
            if (!slot.item) slot.item = escolherItem(poolSemFiltro("equipamento"), exclRep, orc2);
          }
        }
      } else {
        var permitirMedkit2 = !ESTADO.opcoes.forcaMedkit;
        var exclSemDup2 = idsExcluirSemDuplicados(permitirMedkit2);
        slot.item = escolherItem(p2, exclSemDup2, orc2);
        if (!slot.item) slot.item = escolherItem(poolSemFiltro("equipamento"), exclSemDup2, orc2);
        if (!slot.item) {
          var exclRep2 = idsExcluirComLimites(permitirMedkit2);
          slot.item = escolherItem(p2, exclRep2, orc2);
          if (!slot.item) slot.item = escolherItem(poolSemFiltro("equipamento"), exclRep2, orc2);
        }
        if (!slot.item) {
          p2.sort(function (a, b) { return a.preco - b.preco; });
          for (var k = 0; k < p2.length; k++) {
            if (p2[k].preco <= orc2) { slot.item = p2[k]; break; }
          }
        }
      }
    }
  }

  function temItem(id) {
    var found = false;
    ESTADO.slots.forEach(function (s) { if (s.item && s.item.id === id) found = true; });
    return found;
  }

  function pegarPorId(id, grupo) {
    var lista = D[grupo];
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  function gerarTudo() {
    if (ESTADO.animando) return;
    ESTADO.animando = true;
    bloquearControles(true);
    ESTADO.slots = construirSlots();
    ESTADO.trancados = {};
    var posEquipamento = 0;
    ESTADO.slots.forEach(function (s) {
      gerarSlot(s, posEquipamento);
      if (TIPOS_SLOT[s.tipo].tipo === "equipamento") posEquipamento++;
    });
    preencherVaziosEquipamento();
    renderizar();
    destinoAtualizar();
    tocarSelo();
    if (window.HUNT_NO_ANIM) {
      finalizarGeracao();
      return;
    }
    animarReveal(finalizarGeracao);
  }

  function preencherVaziosEquipamento() {
    ESTADO.slots.forEach(function (s, i) {
      if (s.item || TIPOS_SLOT[s.tipo].tipo !== "equipamento") return;
      var pool = poolDisponivel("equipamento");
      pool.sort(function (a, b) { return a.preco - b.preco; });
      for (var k = 0; k < pool.length; k++) {
        var orc = orcamentoPorSlot(i, i);
        if (pool[k].preco <= orc) {
          s.item = pool[k];
          break;
        }
      }
    });
  }

  function finalizarGeracao() {
    bloquearControles(false);
    ESTADO.animando = false;
    tocarRevelacao();
  }

  function posEquipamentoDoIndice(indice) {
    var pos = 0;
    for (var i = 0; i < indice; i++) {
      if (ESTADO.slots[i] && TIPOS_SLOT[ESTADO.slots[i].tipo].tipo === "equipamento") pos++;
    }
    return pos;
  }

  function rerolar(indice) {
    if (ESTADO.animando) return;
    var s = ESTADO.slots[indice];
    if (!s) return;
    var cfg = TIPOS_SLOT[s.tipo];
    var pool = poolDisponivel(cfg.tipo);
    var orc = orcamentoPorSlot(indice, indice);
    var novo = null;
    if (cfg.tipo === "arma") {
      pool = poolCapacidade(pool, indice);
      if (!ESTADO.opcoes.duplicados) {
        var usados = [];
        ESTADO.slots.forEach(function (x, i) {
          if (i !== indice && x.item && TIPOS_SLOT[x.tipo].tipo === "arma") usados.push(x.item.id);
        });
        pool = pool.filter(function (a) { return usados.indexOf(a.id) === -1; });
      }
      novo = escolherItem(pool, [], orc);
    } else if (ESTADO.opcoes.forcaMedkit && posEquipamentoDoIndice(indice) === 1) {
      var mk2 = pegarPorId("medkit", "ferramentas");
      if (mk2 && mk2.preco <= orc) novo = mk2;
      else {
        novo = escolherItem(pool, idsExcluirSemDuplicados(!ESTADO.opcoes.forcaMedkit), orc);
        if (!novo) novo = escolherItem(pool, idsExcluirComLimites(!ESTADO.opcoes.forcaMedkit), orc);
      }
    } else {
      var permitirMedkit = !ESTADO.opcoes.forcaMedkit;
      novo = escolherItem(pool, idsExcluirSemDuplicados(permitirMedkit), orc);
      if (!novo) novo = escolherItem(pool, idsExcluirComLimites(permitirMedkit), orc);
      if (!novo) {
        pool.sort(function (a, b) { return a.preco - b.preco; });
        for (var k = 0; k < pool.length; k++) {
          if (pool[k].preco <= orc) { novo = pool[k]; break; }
        }
      }
    }
    if (novo) {
      aplicarMunicoes(s, novo);
    }
    renderizar();
    if (window.HUNT_NO_ANIM) return;
    var div = divDoSlot(indice);
    if (!div) return;
    var ov = criarOverlay(s);
    div.appendChild(ov);
    setTimeout(function () { landOverlay(ov); }, 800);
  }

  function bloquearControles(ativo) {
    var btn = document.getElementById("btn-gerar");
    if (btn) btn.disabled = ativo;
    if (ativo) document.body.classList.add("animando");
    else document.body.classList.remove("animando");
  }

  function nomesReel(s) {
    var cfg = TIPOS_SLOT[s.tipo];
    var lista;
    if (cfg.tipo === "arma") lista = D.armas;
    else lista = D.ferramentas.concat(D.consumiveis);
    var nomes = [];
    lista.forEach(function (a) { if (a.desbloqueio <= ESTADO.opcoes.rank) nomes.push(a.nome); });
    return nomes;
  }

  function criarOverlay(s) {
    var ov = document.createElement("div");
    ov.className = "reel-overlay";
    var strip = document.createElement("div");
    strip.className = "reel-strip";
    ov.appendChild(strip);
    var nomes = nomesReel(s);
    function prox() {
      if (nomes.length) strip.textContent = nomes[Math.floor(Math.random() * nomes.length)];
      strip.style.transform = "translateY(14px)";
      void ov.offsetWidth;
      strip.style.transform = "translateY(0)";
    }
    strip.textContent = nomes.length ? nomes[0] : "…";
    prox();
    ov._timer = setInterval(prox, 90);
    return ov;
  }

  function landOverlay(ov) {
    if (ov._timer) clearInterval(ov._timer);
    ov.style.pointerEvents = "none";
    ov.classList.add("aterrar");
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 280);
  }

  function divDoSlot(indice) {
    var divs = document.querySelectorAll("#slots-armas .slot, #slots-fc .slot");
    return divs[indice] || null;
  }

  function animarReveal(fim) {
    var divs = document.querySelectorAll("#slots-armas .slot, #slots-fc .slot");
    var reels = [];
    Array.prototype.forEach.call(divs, function (div, i) {
      var ov = criarOverlay(ESTADO.slots[i]);
      div.appendChild(ov);
      reels.push(ov);
    });
    var n = reels.length;
    var duracaoTotal = 6000;
    var inicio = 400;
    var step = n > 1 ? (duracaoTotal - inicio) / (n - 1) : 0;
    reels.forEach(function (ov, k) {
      setTimeout(function () { landOverlay(ov); }, Math.round(inicio + step * k));
    });
    setTimeout(fim, duracaoTotal + 300);
  }

  function alternarTranca(indice) {
    var s = ESTADO.slots[indice];
    if (!s) return;
    if (ESTADO.trancados[indice]) delete ESTADO.trancados[indice];
    else ESTADO.trancados[indice] = true;
    renderizar();
  }

  function itemPorId(id, tipo) {
    var grupos;
    if (tipo === "arma") grupos = [D.armas];
    else grupos = [D.ferramentas, D.consumiveis];
    for (var g = 0; g < grupos.length; g++) {
      for (var i = 0; i < grupos[g].length; i++) {
        if (grupos[g][i].id === id) return grupos[g][i];
      }
    }
    return null;
  }

  function variantesExistentes(slot) {
    if (!slot || !TIPOS_SLOT[slot.tipo] || TIPOS_SLOT[slot.tipo].tipo !== "arma" || !slot.item || !slot.item.variantes) return [];
    return slot.item.variantes.filter(function (vid) { return itemPorId(vid, "arma") !== null; });
  }

  function renderizar() {
    var painelArmas = document.getElementById("slots-armas");
    var painelFC = document.getElementById("slots-fc");
    var grupoArmas = document.getElementById("grupo-armas");
    var grupoFC = document.getElementById("grupo-fc");
    painelArmas.innerHTML = "";
    painelFC.innerHTML = "";
    var total = 0;

    ESTADO.slots.forEach(function (s, i) {
      total += s.item ? s.item.preco : 0;
      var div = document.createElement("div");
      div.className = "slot" + (ESTADO.trancados[i] ? " trancado" : "");
      var ehArma = TIPOS_SLOT[s.tipo] && TIPOS_SLOT[s.tipo].tipo === "arma";
      var municoesVisiveis = (s.item && s.item.municoes && s.item.municoes.length && ehArma)
        ? (ESTADO.opcoes.muniCustom ? s.item.municoes.filter(function (m) { return m === "Standard"; }) : s.item.municoes.slice())
        : [];
      var nomesSel = [];
      if (ehArma && s.item) {
        if (s.municao) nomesSel.push(s.municao);
        if (s.municao2) nomesSel.push(s.municao2);
      }
      div.innerHTML =
        '<div class="slot-corpo">' +
          (s.item
            ? (s.item.img
                ? '<img class="slot-img" src="img/' + s.item.img + '" alt="' + s.item.nome + '" title="' + s.item.nome + ' · $' + s.item.preco + '">'
                : '<div class="slot-simbolo">' + simbolo(s.item) + "</div>" +
                  '<div class="slot-fallback">' + s.item.nome + "</div>")
            : '<div class="slot-vazio">—</div>') +
        "</div>" +
        (s.item && s.item.img ? '<div class="slot-nome">' + s.item.nome + "</div>" : "") +
        (nomesSel.length ? '<div class="slot-municao-nome" title="Selected ammo">' + nomesSel.join(" + ") + "</div>" : "") +
        (municoesVisiveis.length
          ? '<div class="slot-municoes">' + municoesVisiveis.map(function (m) {
              var im = imagemMunicao(s.item, m);
              if (!im) return "";
              var ativa = (s.municao === m || s.municao2 === m) ? " ativa" : "";
              return '<img class="municao-img' + ativa + '" src="img/municoes/' + im + '" alt="' + m + '" title="' + m + '">';
            }).join("") + "</div>"
          : "") +
        '<div class="slot-botoes">' +
          '<button class="btn-dado" title="Reroll">🎲</button>' +
        "</div>";

      div.querySelector(".btn-dado").addEventListener("click", function () { rerolar(i); });

      var imgsMun = div.querySelectorAll(".municao-img");
      for (var k = 0; k < imgsMun.length; k++) {
        imgsMun[k].addEventListener("click", (function (slot, nome) {
          return function () {
            if (!slot.item) return;
            var famIdx = indiceFamilia(slot.item, nome);
            if (slot.item.dupla) {
              if (famIdx >= 1) {
                slot.municao2 = nome;
              } else if (slot.municao !== nome && slot.municao2 !== nome) {
                slot.municao2 = nome;
              }
            } else {
              slot.municao = nome;
            }
            renderizar();
          };
        })(s, imgsMun[k].getAttribute("alt")));
      }

      if (TIPOS_SLOT[s.tipo] && TIPOS_SLOT[s.tipo].tipo === "arma") painelArmas.appendChild(div);
      else painelFC.appendChild(div);
    });

    grupoArmas.style.display = "";
    grupoFC.style.display = ESTADO.opcoes.soArmas ? "none" : "";

    document.getElementById("total").textContent = "$" + total;

    var custo = document.getElementById("custo");
    if (total > ESTADO.opcoes.limitePreco) {
      custo.className = "custo acima";
      custo.textContent = "Over limit!";
    } else {
      custo.className = "custo";
      custo.textContent = "hunt dollars";
    }
  }

  function simbolo(item) {
    if (!item.municoes || !item.municoes.length) return "🔪";
    return "🔫";
  }

  function familiaMunicao(item, nomeMunicao) {
    if (nomeMunicao === "Dragon Breath" || nomeMunicao === "Flechette" ||
        nomeMunicao === "Penny Shot Ammo" || nomeMunicao === "Slug" || nomeMunicao === "Starshell") {
      return "shell";
    }
    if (nomeMunicao === "Explosive Bolt" || nomeMunicao === "Shot Bolt" || nomeMunicao === "Steel Bolt") {
      return "bolt";
    }
    if (nomeMunicao === "Concertina Arrows" || nomeMunicao === "Frag Arrows" || nomeMunicao === "Poison Arrows") {
      return "arrow";
    }
    if (nomeMunicao === "Dragon Breath Charge" || nomeMunicao === "Harpoon" ||
        nomeMunicao === "Steel Ball Ammo" || nomeMunicao === "Waxed Frag Charge") {
      return "lance";
    }
    return item.municao || "compact";
  }

  function municoesPorFamilia(item) {
    var grupos = [];
    var indice = {};
    if (!item || !item.municoes) return grupos;
    item.municoes.forEach(function (m) {
      var fam = familiaMunicao(item, m);
      if (indice[fam] === undefined) {
        indice[fam] = grupos.length;
        grupos.push([]);
      }
      grupos[indice[fam]].push(m);
    });
    return grupos;
  }

  function indiceFamilia(item, nomeMunicao) {
    var grupos = municoesPorFamilia(item);
    for (var i = 0; i < grupos.length; i++) {
      if (grupos[i].indexOf(nomeMunicao) !== -1) return i;
    }
    return 0;
  }

  function imagemMunicao(item, nomeMunicao) {
    if (!window.HUNT_MUNICOES) return "";
    var familia = familiaMunicao(item, nomeMunicao);
    var mapa = window.HUNT_MUNICOES[familia];
    return mapa ? (mapa[nomeMunicao] || "") : "";
  }

  function mostrarVariantes(indice) {
    var s = ESTADO.slots[indice];
    var variantes = variantesExistentes(s);
    if (!variantes.length) return;
    var lista = document.getElementById("variantes-lista");
    lista.innerHTML = "";
    variantes.forEach(function (vid) {
      var v = itemPorId(vid, "arma");
      if (!v) return;
      var li = document.createElement("button");
      li.className = "variante";
      li.innerHTML = (v.img ? '<img src="img/' + v.img + '">' : "") + "<span>" + v.nome + " · $" + v.preco + "</span>";
      li.addEventListener("click", function () {
        s.item = v;
        reconciliarMunicoes(s, v);
        fecharModal("variantes-modal");
        renderizar();
      });
      lista.appendChild(li);
    });
    document.getElementById("variantes-modal").style.display = "flex";
  }

  function fecharModal(id) {
    document.getElementById(id).style.display = "none";
  }

  function ligarOpcoes() {
    var mapa = {
      "op-muni": "muniCustom",
      "op-sobase": "soBase",
      "op-medkit": "forcaMedkit",
      "op-qm": "quartermaster"
    };
    Object.keys(mapa).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", function () {
        ESTADO.opcoes[mapa[id]] = el.checked;
        if (id === "op-qm") { gerarTudo(); return; }
        if (id === "op-muni") {
          ESTADO.slots.forEach(function (s) {
            if (s.item && TIPOS_SLOT[s.tipo] && TIPOS_SLOT[s.tipo].tipo === "arma" && (s.municao || s.municao2)) {
              aplicarMunicoes(s, s.item);
            }
          });
        }
        renderizar();
      });
    });

    var rank = document.getElementById("op-rank");
    rank.addEventListener("change", function () {
      var v = parseInt(rank.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 100) v = 100;
      rank.value = v;
      ESTADO.opcoes.rank = v;
      renderizar();
    });

    var preco = document.getElementById("op-preco");
    preco.addEventListener("change", function () {
      var v = parseInt(preco.value, 10);
      if (isNaN(v) || v < 0) v = 0;
      if (v > 4000) v = 4000;
      preco.value = v;
      ESTADO.opcoes.limitePreco = v;
      renderizar();
    });

    document.getElementById("btn-gerar").addEventListener("click", gerarTudo);
    document.getElementById("btn-fechar-variantes").addEventListener("click", function () { fecharModal("variantes-modal"); });
    ligarBotaoSom();

    var btnSettings = document.getElementById("btn-settings");
    var painelSettings = document.getElementById("settings-painel");
    btnSettings.addEventListener("click", function () {
      painelSettings.hidden = !painelSettings.hidden;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    ligarOpcoes();
    gerarTudo();
  });
})();
