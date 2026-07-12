/**
 * Cursor Education Portfolio — mission engine + Cursor-like IDE shell.
 */
(function () {
  'use strict'

  var ICON_FILE =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h5.586a1.5 1.5 0 0 1 1.06.44l2.414 2.414A1.5 1.5 0 0 1 13 4.914V13.5A1.5 1.5 0 0 1 11.5 15h-8A1.5 1.5 0 0 1 2 13.5v-11zM3.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V5H9.5A1.5 1.5 0 0 1 8 3.5V2H3.5z"/></svg>'
  var ICON_FOLDER =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 4H7.707l-1.15-1.15A1.5 1.5 0 0 0 5.5 2h-4z"/></svg>'

  function findAPI(win) {
    var n = 0
    while (win && n < 8) {
      if (win.API) return win.API
      if (win.parent && win.parent !== win) {
        win = win.parent
        n++
        continue
      }
      break
    }
    return null
  }

  var API = findAPI(window)
  var scormReady = false

  function scormInit() {
    if (!API || scormReady) return
    try {
      API.LMSInitialize('')
      scormReady = true
    } catch (e) {}
  }

  function reportProgress(score, max, status) {
    scormInit()
    if (!API) return
    try {
      if (typeof score === 'number' && typeof max === 'number' && max > 0) {
        API.LMSSetValue('cmi.core.score.raw', String(Math.round(score)))
        API.LMSSetValue('cmi.core.score.max', String(max))
        API.LMSSetValue('cmi.core.score.min', '0')
      }
      API.LMSSetValue('cmi.core.lesson_status', status || 'incomplete')
      API.LMSCommit('')
    } catch (e) {}
  }

  function reportFinish(score, max) {
    scormInit()
    if (!API) return
    try {
      var passed = max > 0 && score / max >= 0.7
      API.LMSSetValue('cmi.core.score.raw', String(Math.round(score)))
      API.LMSSetValue('cmi.core.score.max', String(max))
      API.LMSSetValue('cmi.core.score.min', '0')
      API.LMSSetValue('cmi.core.lesson_status', passed ? 'passed' : 'failed')
      API.LMSCommit('')
      API.LMSFinish('')
    } catch (e) {}
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function renderMarkdown(md) {
    var lines = String(md || '').split('\n')
    var html = []
    var inCode = false
    var codeBuf = []
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i]
      if (line.indexOf('```') === 0) {
        if (inCode) {
          html.push('<pre class="code-block">' + escapeHtml(codeBuf.join('\n')) + '</pre>')
          codeBuf = []
          inCode = false
        } else inCode = true
        continue
      }
      if (inCode) {
        codeBuf.push(line)
        continue
      }
      if (line.indexOf('# ') === 0) html.push('<h1>' + escapeHtml(line.slice(2)) + '</h1>')
      else if (line.indexOf('## ') === 0) html.push('<h2>' + escapeHtml(line.slice(3)) + '</h2>')
      else if (line.indexOf('> ') === 0)
        html.push('<div class="callout">' + escapeHtml(line.slice(2)) + '</div>')
      else if (line.indexOf('- ') === 0) html.push('<div>- ' + escapeHtml(line.slice(2)) + '</div>')
      else if (line.trim() === '') html.push('<br/>')
      else html.push('<p>' + escapeHtml(line) + '</p>')
    }
    if (inCode) html.push('<pre class="code-block">' + escapeHtml(codeBuf.join('\n')) + '</pre>')
    return html.join('')
  }

  var state = {
    config: null,
    missionIndex: 0,
    passed: {},
    earned: {},
    wrongAttempts: {},
    score: 0,
    maxScore: 0,
    openFile: null,
    openTabs: [],
    panel: 'terminal',
    problems: [],
    termHistory: [],
    chatLog: [],
    labBuffers: {},
    finished: false,
    browserHtml: '',
    kanbanPlaced: {},
    awaitingContinue: null,
  }

  function currentMission() {
    return state.config.missions[state.missionIndex] || null
  }

  function missionWrong(id) {
    return state.wrongAttempts[id] || 0
  }

  function pointsForMission(m) {
    var base = m.points || 10
    var penalty = (m.wrongPenalty != null ? m.wrongPenalty : Math.max(2, Math.round(base * 0.2))) * missionWrong(m.id)
    return Math.max(Math.round(base * 0.3), base - penalty)
  }

  function isFileUnlocked(path) {
    var m = currentMission()
    if (!m) return true
    if (m.unlockAllAfterPass && state.passed[m.id]) return true
    var unlock = m.unlockFiles || []
    if (unlock.indexOf('*') >= 0) return true
    if (unlock.indexOf(path) >= 0) return true
    for (var i = 0; i < state.config.missions.length; i++) {
      var mi = state.config.missions[i]
      if (state.passed[mi.id] && (mi.unlockFiles || []).indexOf(path) >= 0) return true
    }
    if (path === 'README.md') return true
    return false
  }

  function recomputeScore() {
    var total = 0
    var max = 0
    state.config.missions.forEach(function (m) {
      max += m.points || 10
      if (state.passed[m.id]) total += state.earned[m.id] != null ? state.earned[m.id] : pointsForMission(m)
    })
    state.score = total
    state.maxScore = max
    var status = 'incomplete'
    if (state.finished) status = total / max >= 0.7 ? 'passed' : 'failed'
    reportProgress(total, max, status)
    updateStatus()
  }

  function updateStatus() {
    var el = document.getElementById('status-score')
    if (el) el.textContent = 'Score ' + state.score + '/' + state.maxScore
    var m = currentMission()
    var pill = document.getElementById('mission-pill')
    if (pill && m) pill.textContent = m.id + ' · ' + m.title
    var scorm = document.getElementById('scorm-pill')
    if (scorm) scorm.textContent = API ? (state.finished ? 'done' : 'in progress') : 'local'
    var hint = document.getElementById('status-hint')
    if (hint && m) hint.textContent = m.hint || ''
    var att = document.getElementById('status-attempts')
    if (att && m) {
      var w = missionWrong(m.id)
      att.textContent = w ? 'Misses: ' + w : ''
    }
  }

  function pushChat(role, text, choices, meta) {
    state.chatLog.push({
      role: role,
      text: text,
      choices: choices || null,
      meta: meta || null,
    })
    renderChat()
  }

  function clearActiveChoices() {
    state.chatLog.forEach(function (msg) {
      if (msg.choices) msg.choices = null
    })
  }

  function renderChat() {
    var box = document.getElementById('chat')
    if (!box) return
    box.innerHTML = ''
    state.chatLog.forEach(function (msg, idx) {
      var div = document.createElement('div')
      var cls = 'bubble ' + msg.role
      if (msg.meta && msg.meta.feedback === 'ok') cls += ' feedback-ok'
      if (msg.meta && msg.meta.feedback === 'bad') cls += ' feedback-bad'
      div.className = cls
      div.innerHTML = escapeHtml(msg.text).replace(/\n/g, '<br/>')
      if (msg.choices && msg.choices.length) {
        var wrap = document.createElement('div')
        wrap.className = 'chat-choices'
        msg.choices.forEach(function (c) {
          var b = document.createElement('button')
          b.type = 'button'
          b.textContent = c.label
          b.addEventListener('click', function () {
            handleChoice(c)
          })
          wrap.appendChild(b)
        })
        div.appendChild(wrap)
      }
      if (msg.meta && msg.meta.continueAction) {
        var cont = document.createElement('button')
        cont.type = 'button'
        cont.className = 'btn-continue'
        cont.textContent = msg.meta.continueLabel || 'Continue'
        cont.addEventListener('click', function () {
          runContinue(msg.meta.continueAction, idx)
        })
        div.appendChild(cont)
      }
      box.appendChild(div)
    })
    box.scrollTop = box.scrollHeight
  }

  function runContinue(action, msgIndex) {
    if (state.chatLog[msgIndex]) {
      state.chatLog[msgIndex].meta = null
      renderChat()
    }
    state.awaitingContinue = null
    if (!action) return
    if (action.openFile) openFile(action.openFile)
    if (action.nextChoices) {
      pushChat('agent', action.prompt || 'Next question:', action.nextChoices)
    }
    if (action.passMission) passMission(action.passMission)
    if (action.startNextMission) advanceToNextMission()
  }

  function handleChoice(choice) {
    clearActiveChoices()
    pushChat('user', choice.label)
    if (choice.openFile) openFile(choice.openFile)
    if (choice.setBrowser) {
      state.browserHtml = choice.setBrowser
      if (state.panel === 'browser') renderPanel()
    }
    if (choice.addProblem) {
      state.problems.push(choice.addProblem)
      renderPanel()
    }
    if (choice.clearProblems) {
      state.problems = []
      renderPanel()
    }

    var m = currentMission()
    var mid = m ? m.id : 'x'

    if (choice.correct === false) {
      state.wrongAttempts[mid] = missionWrong(mid) + 1
      updateStatus()
      var bad =
        choice.feedback ||
        choice.reply ||
        'Not quite. Re-read the teaching note in the editor, then try again.'
      setTimeout(function () {
        pushChat('agent', bad, choice.retryChoices || m.choices || null, { feedback: 'bad' })
      }, 180)
      return
    }

    if (choice.runCheck) {
      runCheck(choice.runCheck, choice)
      return
    }

    if (choice.correct === true || choice.passMission || choice.nextChoices) {
      var good = choice.feedback || choice.reply || 'Correct.'
      var action = {
        nextChoices: choice.nextChoices || null,
        prompt: choice.nextPrompt || null,
        passMission: choice.passMission || null,
        openFile: choice.teachFile || null,
      }
      var needsContinue = true
      setTimeout(function () {
        if (needsContinue) {
          pushChat('agent', good, null, {
            feedback: 'ok',
            continueAction: action,
            continueLabel: choice.continueLabel || (choice.passMission ? 'Complete lesson' : 'Continue'),
          })
        }
      }, 180)
      return
    }

    if (choice.reply) {
      setTimeout(function () {
        pushChat('agent', choice.reply, choice.nextChoices || null)
      }, 180)
    }
  }

  function runCheck(checkId, choice) {
    var m = currentMission()
    if (!m || !m.checks) return
    var check = m.checks[checkId]
    if (!check) return
    var ok = false
    if (check.type === 'labContains') {
      var buf = state.labBuffers[check.file] || ''
      var lower = buf.toLowerCase()
      if (check.allOf && check.allOf.length) {
        ok = check.allOf.every(function (needle) {
          return lower.indexOf(String(needle).toLowerCase()) >= 0
        })
      } else {
        ok = (check.anyOf || []).some(function (needle) {
          return lower.indexOf(String(needle).toLowerCase()) >= 0
        })
      }
    } else if (check.type === 'kanban') {
      ok = Object.keys(check.expect || {}).every(function (cardId) {
        return state.kanbanPlaced[cardId] === check.expect[cardId]
      })
    } else if (check.type === 'always') ok = true

    if (ok) {
      pushChat('agent', check.success || 'Looks good.', null, {
        feedback: 'ok',
        continueAction: {
          passMission: check.passMission || (choice && choice.passMission) || null,
          nextChoices: choice && choice.nextChoices,
        },
        continueLabel: 'Continue',
      })
    } else {
      state.wrongAttempts[m.id] = missionWrong(m.id) + 1
      updateStatus()
      pushChat('agent', check.fail || 'Not yet — adjust and validate again.', null, { feedback: 'bad' })
      state.problems.push({ sev: 'error', text: check.fail || 'Check failed' })
      renderPanel()
    }
  }

  function passMission(id) {
    if (state.passed[id]) return
    var m = state.config.missions.find(function (x) {
      return x.id === id
    })
    var earned = m ? pointsForMission(m) : 10
    state.passed[id] = true
    state.earned[id] = earned
    recomputeScore()
    renderTree()
    pushChat(
      'agent',
      'Lesson ' +
        id +
        ' complete. You earned ' +
        earned +
        '/' +
        (m ? m.points || 10 : 10) +
        ' points' +
        (missionWrong(id) ? ' (' + missionWrong(id) + ' miss' + (missionWrong(id) > 1 ? 'es' : '') + ').' : '.'),
      null,
      {
        feedback: 'ok',
        continueAction: { startNextMission: true },
        continueLabel: 'Next lesson',
      },
    )
  }

  function advanceToNextMission() {
    var idx = state.missionIndex
    if (idx + 1 < state.config.missions.length) {
      state.missionIndex = idx + 1
      updateStatus()
      startMission(currentMission())
    } else {
      finishCourse()
    }
  }

  function finishCourse() {
    state.finished = true
    recomputeScore()
    reportFinish(state.score, state.maxScore)
    var pct = state.maxScore ? Math.round((100 * state.score) / state.maxScore) : 0
    var passed = pct >= 70
    pushChat(
      'agent',
      passed
        ? 'You finished the course. Final score ' + state.score + '/' + state.maxScore + ' (' + pct + '%).'
        : 'Course finished, but score is below 70%. Review misses and retry key lessons if your LMS allows.',
      null,
      { feedback: passed ? 'ok' : 'bad' },
    )
    var overlay = document.getElementById('complete-overlay')
    var scoreEl = document.getElementById('complete-score')
    var msgEl = document.getElementById('complete-msg')
    var titleEl = document.getElementById('complete-title')
    if (scoreEl) scoreEl.textContent = state.score + ' / ' + state.maxScore + ' (' + pct + '%)'
    if (titleEl) titleEl.textContent = passed ? 'Course complete' : 'Course finished — below pass mark'
    if (msgEl)
      msgEl.textContent = passed
        ? 'Nice work. Your score reflects correct answers minus misses. Status reported to Sudar.'
        : 'Pass requires 70%. Misses reduced your score — reopen lessons to practice.'
    if (overlay) overlay.classList.remove('hidden')
  }

  function startMission(m) {
    if (!m) return
    state.chatLog = []
    state.problems = []
    state.awaitingContinue = null
    updateStatus()
    renderTree()
    if (m.teachFile) openFile(m.teachFile)
    else if (m.openFile) openFile(m.openFile)
    if (m.browser) state.browserHtml = m.browser
    var intro = m.teach || m.brief
    if (m.teach && m.brief) {
      pushChat('agent', m.teach)
      setTimeout(function () {
        pushChat('agent', m.brief, m.choices || null)
      }, 250)
    } else {
      pushChat('agent', intro, m.choices || null)
    }
    renderPanel()
  }

  function openFile(path) {
    if (!isFileUnlocked(path)) {
      pushChat('agent', 'That file unlocks after you finish the current lesson.')
      return
    }
    state.openFile = path
    if (state.openTabs.indexOf(path) < 0) state.openTabs.push(path)
    renderTabs()
    renderEditor()
    renderTree()
  }

  function renderTabs() {
    var tabs = document.getElementById('tabs')
    if (!tabs) return
    tabs.innerHTML = ''
    state.openTabs.forEach(function (p) {
      var b = document.createElement('button')
      b.className = 'tab' + (p === state.openFile ? ' active' : '')
      b.textContent = p.split('/').pop()
      b.addEventListener('click', function () {
        openFile(p)
      })
      tabs.appendChild(b)
    })
  }

  function renderEditor() {
    var body = document.getElementById('editor-body')
    if (!body || !state.openFile) return
    var file = state.config.files[state.openFile]
    if (!file) {
      body.innerHTML = '<p>File not found.</p>'
      return
    }
    if (file.kind === 'lab') {
      var existing = state.labBuffers[state.openFile] || file.content
      state.labBuffers[state.openFile] = existing
      body.innerHTML =
        '<h1>' +
        escapeHtml(state.openFile) +
        '</h1><div class="teach"><div class="teach-label">Lab</div>Edit the buffer, then use Coach or Terminal to validate.</div>' +
        '<textarea class="lab-edit" id="lab-buffer">' +
        escapeHtml(existing) +
        '</textarea>'
      var ta = document.getElementById('lab-buffer')
      ta.addEventListener('input', function () {
        state.labBuffers[state.openFile] = ta.value
      })
      return
    }
    if (file.kind === 'kanban') {
      body.innerHTML =
        '<h1>' +
        escapeHtml(file.title || 'Board') +
        '</h1><p>' +
        escapeHtml(file.blurb || '') +
        '</p><div class="kanban" id="kanban"></div>'
      renderKanban(file)
      return
    }
    var md = renderMarkdown(file.content || '')
    if (file.kind === 'teach' || (currentMission() && currentMission().teachFile === state.openFile)) {
      body.innerHTML = '<div class="teach"><div class="teach-label">Teaching note</div></div>' + md
    } else body.innerHTML = md
  }

  function renderKanban(file) {
    var root = document.getElementById('kanban')
    if (!root) return
    root.innerHTML = ''
    ;(file.columns || []).forEach(function (col) {
      var colEl = document.createElement('div')
      colEl.className = 'kanban-col'
      colEl.dataset.col = col.id
      colEl.innerHTML = '<h3>' + escapeHtml(col.title) + '</h3>'
      colEl.addEventListener('dragover', function (e) {
        e.preventDefault()
      })
      colEl.addEventListener('drop', function (e) {
        e.preventDefault()
        var cardId = e.dataTransfer.getData('text/plain')
        state.kanbanPlaced[cardId] = col.id
        renderKanban(file)
      })
      root.appendChild(colEl)
    })
    ;(file.cards || []).forEach(function (card) {
      var placed = state.kanbanPlaced[card.id] || card.defaultColumn || file.columns[0].id
      state.kanbanPlaced[card.id] = placed
      var colEl = root.querySelector('[data-col="' + placed + '"]')
      if (!colEl) return
      var cardEl = document.createElement('div')
      cardEl.className = 'kanban-card'
      cardEl.draggable = true
      cardEl.textContent = card.label
      cardEl.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', card.id)
      })
      colEl.appendChild(cardEl)
    })
  }

  function renderTree() {
    var tree = document.getElementById('tree')
    if (!tree) return
    tree.innerHTML = ''
    ;(state.config.tree || []).forEach(function (node) {
      renderTreeNode(tree, node, 0)
    })
  }

  function renderTreeNode(parent, node, depth) {
    if (node.type === 'folder') {
      var folderBtn = document.createElement('div')
      folderBtn.className = 'tree-item'
      folderBtn.style.setProperty('--depth', String(depth))
      folderBtn.innerHTML = '<span class="icon">' + ICON_FOLDER + '</span>' + escapeHtml(node.name)
      parent.appendChild(folderBtn)
      ;(node.children || []).forEach(function (c) {
        renderTreeNode(parent, c, depth + 1)
      })
      return
    }
    var path = node.path
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className =
      'tree-item' +
      (state.openFile === path ? ' active' : '') +
      (!isFileUnlocked(path) ? ' locked' : '')
    btn.style.setProperty('--depth', String(depth))
    btn.innerHTML = '<span class="icon">' + ICON_FILE + '</span>' + escapeHtml(node.name)
    btn.addEventListener('click', function () {
      openFile(path)
    })
    parent.appendChild(btn)
  }

  function termPrint(text, cls) {
    state.termHistory.push({ text: text, cls: cls || '' })
    renderPanel()
  }

  function handleTerminal(cmd) {
    var raw = String(cmd || '').trim()
    if (!raw) return
    termPrint('$ ' + raw, 'cmd')
    var m = currentMission()
    var handlers = (m && m.terminal) || {}
    var key = raw.toLowerCase()
    var hit = null
    Object.keys(handlers).forEach(function (k) {
      if (key === k.toLowerCase() || key.indexOf(k.toLowerCase()) === 0) hit = handlers[k]
    })
    if (!hit && state.config.globalTerminal) {
      Object.keys(state.config.globalTerminal).forEach(function (k) {
        if (key === k.toLowerCase() || key.indexOf(k.toLowerCase()) === 0)
          hit = state.config.globalTerminal[k]
      })
    }
    if (!hit) {
      termPrint('command not found: ' + raw + ' — try help', 'err')
      return
    }
    termPrint(hit.output || '', hit.ok ? 'ok' : '')
    if (hit.setBrowser) state.browserHtml = hit.setBrowser
    if (hit.passMission) {
      pushChat('agent', hit.reply || 'Terminal check passed.', null, {
        feedback: 'ok',
        continueAction: { passMission: hit.passMission },
        continueLabel: 'Complete lesson',
      })
    } else if (hit.reply) pushChat('agent', hit.reply)
    renderPanel()
  }

  function renderPanel() {
    var term = document.getElementById('panel-terminal')
    var probs = document.getElementById('panel-problems')
    var browser = document.getElementById('panel-browser')
    ;[term, probs, browser].forEach(function (el) {
      if (el) el.classList.add('hidden')
    })
    if (state.panel === 'terminal' && term) {
      term.classList.remove('hidden')
      term.innerHTML = state.termHistory
        .map(function (l) {
          return '<div class="term-line ' + l.cls + '">' + escapeHtml(l.text) + '</div>'
        })
        .join('')
      term.innerHTML +=
        '<div class="term-input-row"><span>$</span><input id="term-input" autocomplete="off" placeholder="help" /></div>'
      var input = document.getElementById('term-input')
      input.focus()
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var v = input.value
          input.value = ''
          handleTerminal(v)
        }
      })
    }
    if (state.panel === 'problems' && probs) {
      probs.classList.remove('hidden')
      if (!state.problems.length) probs.innerHTML = '<div class="term-line ok">No problems</div>'
      else
        probs.innerHTML = state.problems
          .map(function (p) {
            return (
              '<div class="problem"><span class="sev">' +
              escapeHtml(p.sev || 'error') +
              '</span> ' +
              escapeHtml(p.text) +
              '</div>'
            )
          })
          .join('')
    }
    if (state.panel === 'browser' && browser) {
      browser.classList.remove('hidden')
      browser.innerHTML =
        '<div class="browser-frame">' +
        (state.browserHtml || '<em>Preview empty until a lab writes here.</em>') +
        '</div>'
    }
  }

  function bindUi() {
    document.querySelectorAll('.panel-tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.panel = btn.getAttribute('data-panel')
        document.querySelectorAll('.panel-tabs button').forEach(function (b) {
          b.classList.toggle('active', b === btn)
        })
        renderPanel()
      })
    })
    var send = document.getElementById('chat-send')
    var cin = document.getElementById('chat-input')
    function sendChat() {
      var v = (cin.value || '').trim()
      if (!v) return
      cin.value = ''
      pushChat('user', v)
      var m = currentMission()
      var replies = (m && m.freeText) || []
      var matched = null
      replies.forEach(function (r) {
        if (matched) return
        if (
          r.match.some(function (needle) {
            return v.toLowerCase().indexOf(needle.toLowerCase()) >= 0
          })
        )
          matched = r
      })
      if (matched) {
        setTimeout(function () {
          if (matched.passMission || matched.runCheck) {
            pushChat('agent', matched.reply || 'Got it.', null, {
              feedback: 'ok',
              continueAction: {
                passMission: matched.passMission || null,
                runCheck: matched.runCheck || null,
              },
              continueLabel: 'Continue',
            })
            if (matched.runCheck) runCheck(matched.runCheck)
          } else pushChat('agent', matched.reply, matched.choices || null)
        }, 200)
      } else {
        setTimeout(function () {
          pushChat(
            'agent',
            (m && m.fallbackReply) ||
              'Use the choices above, or ask about a term from the teaching note.',
          )
        }, 200)
      }
    }
    if (send) send.addEventListener('click', sendChat)
    if (cin)
      cin.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendChat()
      })
    var dismiss = document.getElementById('complete-dismiss')
    if (dismiss)
      dismiss.addEventListener('click', function () {
        var overlay = document.getElementById('complete-overlay')
        if (overlay) overlay.classList.add('hidden')
      })
  }

  function mount(config) {
    state.config = config
    document.body.setAttribute('data-shell', config.shell || 'ide')
    document.getElementById('brand').textContent = config.title
    document.getElementById('agent-name').textContent = config.agentName || 'Coach'
    document.getElementById('agent-sub').textContent = config.agentSub || 'Teaching coach'
    document.getElementById('explorer-label').textContent = config.explorerLabel || 'Explorer'
    scormInit()
    reportProgress(
      0,
      config.missions.reduce(function (a, m) {
        return a + (m.points || 10)
      }, 0),
      'incomplete',
    )
    bindUi()
    renderTree()
    state.termHistory = [{ text: config.welcomeTerminal || 'Type help to begin.', cls: 'ok' }]
    state.panel = 'terminal'
    renderPanel()
    state.missionIndex = 0
    recomputeScore()
    startMission(currentMission())
    if (!state.openFile) openFile('README.md')
  }

  function boot() {
    if (window.COURSE_CONFIG) {
      mount(window.COURSE_CONFIG)
      return
    }
    fetch('./course.json')
      .then(function (r) {
        return r.json()
      })
      .then(mount)
      .catch(function (err) {
        document.body.innerHTML =
          '<pre style="padding:2rem;color:#f14c4c">Failed to load course.json: ' +
          escapeHtml(String(err)) +
          '</pre>'
      })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()
