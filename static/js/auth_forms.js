document.addEventListener('DOMContentLoaded', function () {
  // Password show/hide toggles
  document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-toggle-password');
      var input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  // Real-time password strength & requirements feedback
  document.querySelectorAll('[data-pw-meter]').forEach(function (panel) {
    var inputId = panel.getAttribute('data-pw-meter');
    var input = inputId ? document.getElementById(inputId) : null;
    if (!input) return;

    var bar = panel.querySelector('[data-pw-bar]');
    var labelEl = panel.querySelector('[data-pw-label]');
    var guidanceEl = panel.querySelector('[data-pw-guidance]');
    var countEl = panel.querySelector('[data-pw-count]');
    var reqEls = {
      length: panel.querySelector('[data-req="length"]'),
      upper: panel.querySelector('[data-req="upper"]'),
      number: panel.querySelector('[data-req="number"]'),
      special: panel.querySelector('[data-req="special"]'),
    };

    var update = function () {
      var val = input.value || '';
      var hasLen = val.length >= 8;
      var hasUpper = /[A-Z]/.test(val);
      var hasLower = /[a-z]/.test(val);
      var hasNum = /\d/.test(val);
      var hasSpec = /[^A-Za-z0-9]/.test(val);

      var states = { length: hasLen, upper: hasUpper, number: hasNum, special: hasSpec };
      var metCount = 0;
      Object.keys(states).forEach(function (k) {
        var met = states[k];
        if (met) metCount += 1;
        var el = reqEls[k];
        if (el) {
          el.classList.toggle('is-met', met);
          el.setAttribute('data-met', met ? 'true' : 'false');
        }
      });

      if (countEl) {
        countEl.textContent = metCount + '/4 met';
      }

      if (!val) {
        if (bar) {
          bar.style.width = '0%';
          bar.style.backgroundColor = '#E5DFD9';
        }
        if (labelEl) {
          labelEl.textContent = 'Not entered';
          labelEl.style.color = '';
        }
        if (guidanceEl) {
          guidanceEl.textContent = 'Use 8+ characters combining uppercase letters, numbers, and special characters.';
        }
        return;
      }

      var pts = 0;
      if (hasLen) pts += 1;
      if (/[A-Za-z]/.test(val) && (hasNum || hasSpec)) pts += 1;
      if ((hasUpper && hasLower) || val.length >= 10) pts += 1;
      if ((val.length >= 12 && (hasNum || hasSpec)) || (hasUpper && hasLower && hasNum && hasSpec)) pts += 1;
      var score = Math.min(4, Math.max(1, pts));

      var config = {
        1: { pct: '25%', color: '#B83232', label: 'Weak', msg: 'Enter at least 8 characters with letters and numbers or symbols.' },
        2: { pct: '50%', color: '#D97706', label: 'Fair', msg: 'Add uppercase + lowercase letters or special characters.' },
        3: { pct: '75%', color: '#E2A919', label: 'Good', msg: 'Good strength — add a special character or 12+ length.' },
        4: { pct: '100%', color: '#15803D', label: 'Strong', msg: 'Strong institutional password meets all security recommendations.' },
      }[score];

      if (bar) {
        bar.style.width = config.pct;
        bar.style.backgroundColor = config.color;
      }
      if (labelEl) {
        labelEl.textContent = config.label;
        labelEl.style.color = config.color;
      }
      if (guidanceEl) {
        guidanceEl.textContent = config.msg;
      }
    };

    input.addEventListener('input', update);
    update();
  });

  // Demo credentials copy & autofill helpers (dev demo mode only)
  function copyTextToClipboard(text, btn) {
    if (!text) return;
    var originalHtml = btn.innerHTML;
    var markCopied = function () {
      btn.classList.add('btn-success');
      btn.classList.remove('btn-outline-secondary');
      btn.innerHTML = '<svg class="copy-icon me-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg><span class="copy-btn-label">Copied!</span>';
      setTimeout(function () {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-outline-secondary');
        btn.innerHTML = originalHtml;
      }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(markCopied).catch(function () {
        fallbackCopyText(text, markCopied);
      });
    } else {
      fallbackCopyText(text, markCopied);
    }
  }

  function fallbackCopyText(text, callback) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (callback) callback();
    } catch (err) {}
    document.body.removeChild(textArea);
  }

  // Copy buttons on Demo Access card
  document.querySelectorAll('#copyUsernameBtn, #copyPasswordBtn, [data-copy-type]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var copyType = btn.getAttribute('data-copy-type');
      var val = btn.getAttribute('data-copy-value');
      if (!val) {
        if (copyType === 'username') {
          var uEl = document.getElementById('demoUsernameVal');
          val = uEl ? uEl.textContent.trim() : '';
        } else if (copyType === 'password') {
          var pEl = document.getElementById('demoPasswordVal');
          val = pEl ? pEl.textContent.trim() : '';
        }
      }
      copyTextToClipboard(val, btn);
    });
  });

  // Legacy copy target support
  document.querySelectorAll('[data-copy-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var val = btn.getAttribute('data-copy-target') || '';
      if (!val || btn.id === 'copyUsernameBtn' || btn.id === 'copyPasswordBtn') return;
      var original = btn.textContent;
      var markCopied = function () {
        btn.textContent = 'Copied';
        setTimeout(function () {
          btn.textContent = original;
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(markCopied).catch(function () {});
      }
    });
  });

  // Dynamic Role Switcher on login pages
  var demoDataEl = document.getElementById('demo-credentials-data');
  var roleCredsMap = null;
  if (demoDataEl) {
    try {
      roleCredsMap = JSON.parse(demoDataEl.textContent);
    } catch (e) {
      roleCredsMap = null;
    }
  }

  var roleSvgIcons = {
    student: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    faculty: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
    admin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
  };

  function updateLoginRoleUI(targetRole) {
    if (!targetRole) return;
    var normRole = targetRole.toLowerCase();

    // 1. Update Role Switcher Tabs
    document.querySelectorAll('.auth-role-switcher .auth-role-tab').forEach(function (tab) {
      var tabRole = (tab.getAttribute('data-role') || '').toLowerCase();
      var isActive = tabRole === normRole;
      tab.classList.toggle('is-active', isActive);
      if (isActive) {
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.removeAttribute('aria-current');
      }
    });

    var creds = roleCredsMap ? roleCredsMap[normRole] : null;

    // 2. Update Demo Access Card
    var demoCard = document.getElementById('demoAccessCard');
    if (demoCard && creds) {
      demoCard.setAttribute('data-current-role', normRole);

      var titleEl = document.getElementById('demoCardTitle');
      if (titleEl) titleEl.textContent = creds.role_label + ' Demo Access';

      var subTitleEl = document.getElementById('demoCardSubtitle');
      if (subTitleEl) subTitleEl.textContent = 'Institutional test credentials for ' + creds.portal_name;

      var badgeEl = document.getElementById('demoRoleBadge');
      if (badgeEl) {
        badgeEl.textContent = creds.badge;
        badgeEl.className = 'auth-demo-badge ' + creds.icon_class;
      }

      var pillTextEl = document.getElementById('demoRolePillText');
      if (pillTextEl) pillTextEl.textContent = creds.role_label + ' Role';

      var inlineIconEl = document.getElementById('demoRoleInlineIcon');
      if (inlineIconEl && roleSvgIcons[normRole]) {
        inlineIconEl.innerHTML = roleSvgIcons[normRole];
      }

      var uValEl = document.getElementById('demoUsernameVal');
      if (uValEl) uValEl.textContent = creds.username;

      var pValEl = document.getElementById('demoPasswordVal');
      if (pValEl) pValEl.textContent = creds.password;

      var copyUBtn = document.getElementById('copyUsernameBtn');
      if (copyUBtn) copyUBtn.setAttribute('data-copy-value', creds.username);

      var copyPBtn = document.getElementById('copyPasswordBtn');
      if (copyPBtn) copyPBtn.setAttribute('data-copy-value', creds.password);

      var activeRoleLabel = document.getElementById('demoActiveRoleLabel');
      if (activeRoleLabel) activeRoleLabel.textContent = creds.role_label;

      var fillRoleName = document.getElementById('demoFillRoleName');
      if (fillRoleName) fillRoleName.textContent = creds.role_label;

      var autoFillBtn = document.getElementById('demoAutoFillBtn');
      if (autoFillBtn) {
        autoFillBtn.setAttribute('data-demo-uid', creds.username);
        autoFillBtn.setAttribute('data-demo-pwd', creds.password);
        autoFillBtn.setAttribute('data-demo-role', creds.role_label);
      }

      var statusEl = demoCard.querySelector('[data-demo-autofill-status]');
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.add('d-none');
      }
    }

    // 3. Update Login Card Styling, Headings & Form Action
    var authCard = document.getElementById('authLoginCard');
    if (authCard && creds) {
      authCard.style.setProperty('border-top', '4px solid ' + creds.accent_color, 'important');
    }

    var authIcon = document.getElementById('authRoleIcon');
    if (authIcon && creds) {
      authIcon.className = 'auth-role-icon ' + creds.icon_class + ' mb-2';
      authIcon.textContent = creds.badge;
    }

    var authSubtitle = document.getElementById('authSubtitle');
    if (authSubtitle && creds) {
      authSubtitle.textContent = creds.subtitle;
      authSubtitle.style.color = creds.accent_color;
    }

    var authHeading = document.getElementById('authHeading');
    if (authHeading && creds) {
      authHeading.textContent = creds.heading;
    }

    var authHint = document.getElementById('authHint');
    if (authHint && creds) {
      authHint.textContent = creds.hint;
    }

    var authForm = document.getElementById('authLoginForm');
    if (authForm && creds) {
      authForm.setAttribute('action', creds.action_url);
    }

    var authSubmitBtn = document.getElementById('authSubmitBtn');
    if (authSubmitBtn && creds) {
      authSubmitBtn.textContent = creds.submit_label;
    }

    // 4. Update Document Title
    if (creds) {
      document.title = creds.role_label + ' Login - MCA SMART CAMPUS | Beyond Academics. Built for Growth.';
    }
  }

  // Bind clicks on role switcher tabs for instant, seamless dynamic updates
  document.querySelectorAll('.auth-role-switcher .auth-role-tab').forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      // Allow standard Ctrl/Cmd/middle click to open in new tab
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.which === 2 || e.button === 1) {
        return;
      }
      var targetRole = tab.getAttribute('data-role');
      if (!targetRole) return;

      e.preventDefault();
      updateLoginRoleUI(targetRole);

      // Update URL without reloading page if history API available
      if (roleCredsMap && roleCredsMap[targetRole] && window.history && window.history.pushState) {
        window.history.pushState({ role: targetRole }, '', roleCredsMap[targetRole].action_url);
      }
    });
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function () {
    var path = window.location.pathname.toLowerCase();
    var detectedRole = 'student';
    if (path.indexOf('faculty') !== -1) {
      detectedRole = 'faculty';
    } else if (path.indexOf('admin') !== -1) {
      detectedRole = 'admin';
    }
    updateLoginRoleUI(detectedRole);
  });

  // Demo autofill handler
  document.querySelectorAll('[data-demo-autofill]').forEach(function (btn) {
    var box = btn.closest('.auth-demo-card') || btn.closest('.auth-demo-box');
    var statusEl = box ? box.querySelector('[data-demo-autofill-status]') : null;
    var userInput = document.getElementById('id_username');
    var pwdInput = document.getElementById('id_password');

    var clearStatus = function () {
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.add('d-none');
      }
    };

    if (userInput) {
      userInput.addEventListener('input', clearStatus);
    }
    if (pwdInput) {
      pwdInput.addEventListener('input', clearStatus);
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var uid = btn.getAttribute('data-demo-uid') || '';
      var pwd = btn.getAttribute('data-demo-pwd') || '';
      var roleLabel = btn.getAttribute('data-demo-role') || 'Demo';
      if (userInput) {
        userInput.value = uid;
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (pwdInput) {
        pwdInput.value = pwd;
        pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (statusEl) {
        statusEl.textContent = roleLabel + ' demo credentials auto-filled. Click Sign In to continue.';
        statusEl.classList.remove('d-none');
      }
    });
  });
});
