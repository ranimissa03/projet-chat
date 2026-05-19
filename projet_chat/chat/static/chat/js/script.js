// Simple polling chat client: loads messages and sends new ones.
(function(){
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const csrftoken = getCookie('csrftoken');

  function buildUrl(path) {
    if (!path.startsWith('/')) path = '/' + path;
    return path;
  }

  function renderMessages(container, messages, permissions = { can_edit_own: true, can_delete_own: true, can_moderate: false }){
    console.log('renderMessages called with', messages.length, 'messages and permissions:', permissions);
    container.innerHTML = '';
    messages.forEach(m => {
      const el = document.createElement('div');
      el.className = 'mb-2 message-item';
      el.setAttribute('data-message-id', m.id);
      
      // Create the message content
      const contentDiv = document.createElement('div');
      contentDiv.className = 'd-flex justify-content-between align-items-start';
      
      const textDiv = document.createElement('div');
      textDiv.className = 'flex-grow-1';
      let html = `<strong>${escapeHtml(m.auteur)}</strong>: <span class="message-content">${escapeHtml(m.contenu)}</span>`;
      if (m.fichier_url) {
        const fileName = m.fichier_nom || 'Fichier';
        const fileExt = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
          html += `<div class="mt-1"><img src="${m.fichier_url}" alt="${fileName}" class="img-fluid rounded" style="max-width: 300px; max-height: 300px;"></div>`;
        } else {
          html += `<div class="mt-1"><a href="${m.fichier_url}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-download"></i> ${escapeHtml(fileName)}</a></div>`;
        }
      }
      html += ` <div class="text-muted small">${new Date(m.date_envoi).toLocaleString()}</div>`;
      textDiv.innerHTML = html;
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      
      // Show edit/delete buttons for own messages
      if (m.auteur === window.CURRENT_USER && permissions.can_edit_own) {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-warning ms-2 edit-btn';
        editBtn.setAttribute('data-message-id', m.id);
        editBtn.title = 'Modifier';
        editBtn.innerHTML = '✏️';
        editBtn.style.fontSize = '1rem';
        editBtn.style.padding = '2px 6px';
        
        actionsDiv.appendChild(editBtn);
        editBtn.addEventListener('click', () => handleEdit(m.id, el, container));
      }
      
      // Show delete button for own messages or if moderator
      if ((m.auteur === window.CURRENT_USER && permissions.can_delete_own) || permissions.can_moderate) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger ms-2 delete-btn';
        deleteBtn.setAttribute('data-message-id', m.id);
        deleteBtn.title = 'Supprimer';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.style.fontSize = '1rem';
        deleteBtn.style.padding = '2px 6px';
        
        actionsDiv.appendChild(deleteBtn);
        deleteBtn.addEventListener('click', () => handleDelete(m.id, el, container));
      }
      
      contentDiv.appendChild(textDiv);
      contentDiv.appendChild(actionsDiv);
      el.appendChild(contentDiv);
      
      container.appendChild(el);
    });
    container.scrollTop = container.scrollHeight;
    
    // Debug: count buttons in DOM
    const editButtons = container.querySelectorAll('.edit-btn');
    const deleteButtons = container.querySelectorAll('.delete-btn');
    console.log('After rendering:', editButtons.length, 'edit buttons and', deleteButtons.length, 'delete buttons found in DOM');
  }

  function appendMessage(container, m, permissions = { can_edit_own: true, can_delete_own: true, can_moderate: false }){
    const el = document.createElement('div');
    el.className = 'mb-2 message-item';
    el.setAttribute('data-message-id', m.id);
    
    // Create the message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'd-flex justify-content-between align-items-start';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'flex-grow-1';
    let html = `<strong>${escapeHtml(m.auteur)}</strong>: <span class="message-content">${escapeHtml(m.contenu)}</span>`;
    if (m.fichier_url) {
      const fileName = m.fichier_nom || 'Fichier';
      const fileExt = fileName.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        html += `<div class="mt-1"><img src="${m.fichier_url}" alt="${fileName}" class="img-fluid rounded" style="max-width: 300px; max-height: 300px;"></div>`;
      } else {
        html += `<div class="mt-1"><a href="${m.fichier_url}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-download"></i> ${escapeHtml(fileName)}</a></div>`;
      }
    }
    html += ` <div class="text-muted small">${new Date(m.date_envoi).toLocaleString()}</div>`;
    textDiv.innerHTML = html;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    // Show edit/delete buttons for own messages
    if (m.auteur === window.CURRENT_USER && permissions.can_edit_own) {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-outline-secondary edit-btn';
      editBtn.setAttribute('data-message-id', m.id);
      editBtn.title = 'Modifier';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      
      actionsDiv.appendChild(editBtn);
      editBtn.addEventListener('click', () => handleEdit(m.id, el, container));
    }
    
    // Show delete button for own messages or if moderator
    if ((m.auteur === window.CURRENT_USER && permissions.can_delete_own) || permissions.can_moderate) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-outline-danger delete-btn';
      deleteBtn.setAttribute('data-message-id', m.id);
      deleteBtn.title = 'Supprimer';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      
      actionsDiv.appendChild(deleteBtn);
      deleteBtn.addEventListener('click', () => handleDelete(m.id, el, container));
    }
    
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(actionsDiv);
    el.appendChild(contentDiv);
    
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function escapeHtml(s){
    if(!s) return '';
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  function showAlert(container, message, type='danger'){
    // remove existing alerts
    const existing = container.querySelector('.chat-alert');
    if(existing) existing.remove();
    const a = document.createElement('div');
    a.className = `alert alert-${type} chat-alert`;
    a.textContent = message;
    container.insertBefore(a, container.firstChild);
    // auto-hide after 6s
    setTimeout(()=>{ a.classList.add('fade'); a.classList.remove('show'); try{a.remove()}catch(e){} }, 6000);
  }

  async function getUserPermissions(salonSlug) {
    try {
      const resp = await fetch(buildUrl(`api/salon/${salonSlug}/users/`), {credentials: 'same-origin'});
      if (!resp.ok) return { can_edit_own: true, can_delete_own: true, can_moderate: false };

      const data = await resp.json();
      const currentUser = data.users.find(u => u.username === window.CURRENT_USER);
      console.log('User permissions data:', data, 'Current user:', window.CURRENT_USER, 'Found user:', currentUser);

      if (!currentUser) return { can_edit_own: true, can_delete_own: true, can_moderate: false };

      const permissions = {
        can_edit_own: true,
        can_delete_own: true,
        can_moderate: currentUser.is_moderator || currentUser.is_admin,
        is_admin: currentUser.is_admin,
        is_moderator: currentUser.is_moderator,
        is_banned: currentUser.is_banned
      };
      console.log('Calculated permissions:', permissions);
      return permissions;
    } catch (e) {
      console.error('Error getting user permissions:', e);
      return { can_edit_own: true, can_delete_own: true, can_moderate: false };
    }
  }

  function attachListeners(container) {
    container.querySelectorAll('.edit-btn').forEach(btn => {
      const messageId = btn.getAttribute('data-message-id');
      const messageItem = btn.closest('.message-item');
      btn.addEventListener('click', () => handleEdit(messageId, messageItem, container));
    });
    container.querySelectorAll('.delete-btn').forEach(btn => {
      const messageId = btn.getAttribute('data-message-id');
      const messageItem = btn.closest('.message-item');
      btn.addEventListener('click', () => handleDelete(messageId, messageItem, container));
    });
  }

  async function handleEdit(messageId, messageItem, container) {
    console.log('handleEdit called for message', messageId);
    const contentSpan = messageItem.querySelector('.message-content');
    
    const currentContent = contentSpan.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control form-control-sm d-inline-block';
    input.style.width = '70%';
    input.value = currentContent;
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-sm btn-success ms-1';
    saveBtn.textContent = 'Sauver';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-sm btn-secondary ms-1';
    cancelBtn.textContent = 'Annuler';
    
    const originalHtml = contentSpan.innerHTML;
    contentSpan.innerHTML = '';
    contentSpan.appendChild(input);
    contentSpan.appendChild(saveBtn);
    contentSpan.appendChild(cancelBtn);
    
    input.focus();
    input.select();
    
    saveBtn.addEventListener('click', async () => {
      const newContent = input.value.trim();
      if (newContent && newContent !== currentContent) {
        try {
          const resp = await fetch(buildUrl(`api/messages/${messageId}/edit/`), {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({contenu: newContent})
          });
          
          if (!resp.ok) {
            const error = await resp.json();
            showAlert(container, error.error || 'Erreur lors de la modification');
            return;
          }
          
          contentSpan.innerHTML = escapeHtml(newContent);
          showAlert(container, 'Message modifié avec succès', 'success');
        } catch (e) {
          console.error(e);
          showAlert(container, 'Erreur réseau lors de la modification');
        }
      } else {
        contentSpan.innerHTML = originalHtml;
      }
    });
    
    cancelBtn.addEventListener('click', () => {
      contentSpan.innerHTML = originalHtml;
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      } else if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });
  }

  async function handleDelete(messageId, messageItem, container) {
    console.log('handleDelete called for message', messageId);
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      try {
        const resp = await fetch(buildUrl(`api/messages/${messageId}/delete/`), {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-CSRFToken': csrftoken,
          }
        });
        
        if (!resp.ok) {
          const error = await resp.json();
          showAlert(container, error.error || 'Erreur lors de la suppression');
          return;
        }
        
        // Remove the message from DOM
        messageItem.remove();
        showAlert(container, 'Message supprimé avec succès', 'success');
      } catch (e) {
        console.error(e);
        showAlert(container, 'Erreur réseau lors de la suppression');
      }
    }
  }

  function start(chatSlug, channelSlug = null){
    const messagesEl = document.getElementById('messages');
    const form = document.getElementById('sendForm');
    const input = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    const fileBtn = document.getElementById('fileBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const filePreview = document.getElementById('filePreview');
    let userPermissions = { can_edit_own: true, can_delete_own: true, can_moderate: false };

    console.log('Starting chat with elements:', {
      messagesEl,
      form,
      input,
      fileInput,
      fileBtn,
      emojiBtn,
      filePreview,
      chatSlug,
      channelSlug,
      CURRENT_USER: window.CURRENT_USER
    });

    if(!messagesEl || !form || !input) {
      console.error('Required elements not found');
      return;
    }

    // Test button to verify JavaScript is working
    const testBtn = document.createElement('button');
    testBtn.className = 'btn btn-primary mb-2';
    testBtn.textContent = 'Test JavaScript';
    testBtn.addEventListener('click', () => {
      alert('JavaScript fonctionne ! Permissions: ' + JSON.stringify(userPermissions));
    });
    messagesEl.appendChild(testBtn);

    // File upload handling
    if (fileBtn && fileInput) {
      console.log('Setting up file button handlers');
      fileBtn.addEventListener('click', () => {
        console.log('File button clicked');
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        console.log('File input changed', e.target.files);
        const file = e.target.files[0];
        if (file) {
          // Show preview
          if (filePreview) {
            const fileName = file.name;
            const fileExt = fileName.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
              const reader = new FileReader();
              reader.onload = (e) => {
                filePreview.innerHTML = `<div class="alert alert-info"><strong>Fichier sélectionné:</strong> <img src="${e.target.result}" class="img-thumbnail" style="max-width: 100px; max-height: 100px;"> ${fileName}</div>`;
                filePreview.style.display = 'block';
              };
              reader.readAsDataURL(file);
            } else {
              filePreview.innerHTML = `<div class="alert alert-info"><strong>Fichier sélectionné:</strong> ${fileName}</div>`;
              filePreview.style.display = 'block';
            }
          }
        } else {
          if (filePreview) {
            filePreview.style.display = 'none';
          }
        }
      });
    } else {
      console.log('File button or input not found', fileBtn, fileInput);
    }

    // Emoji handling
    if (emojiBtn && input) {
      console.log('Setting up emoji button handlers');
      const emojiPicker = document.getElementById('emojiPicker');
      emojiBtn.addEventListener('click', () => {
        console.log('Emoji button clicked');
        if (emojiPicker) {
          emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
        }
      });

      // Handle emoji selection
      if (emojiPicker) {
        emojiPicker.addEventListener('click', (e) => {
          if (e.target.classList.contains('emoji-option')) {
            const emoji = e.target.getAttribute('data-emoji');
            console.log('Emoji selected:', emoji);
            input.value += emoji;
            input.focus();
            emojiPicker.style.display = 'none';
          }
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
          if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
            emojiPicker.style.display = 'none';
          }
        });
      }
    } else {
      console.log('Emoji button or input not found', emojiBtn, input);
    }

    // Determine API endpoints based on whether it's a channel or salon
    const isChannel = channelSlug !== null;
    const messagesUrl = isChannel 
      ? `api/salon/${chatSlug}/${channelSlug}/messages/`
      : `api/salon/${chatSlug}/messages/`;
    const sendUrl = isChannel 
      ? `api/salon/${chatSlug}/${channelSlug}/messages/send/`
      : `api/salon/${chatSlug}/messages/send/`;

    async function load(){
      console.log('load() called');
      try{
        const resp = await fetch(buildUrl(messagesUrl), {credentials: 'same-origin'});
        if(resp.status === 404){
          // Salon/Channel has been deleted
          showAlert(messagesEl, 'Ce salon/canal a été supprimé.', 'warning');
          const pollInterval = messagesEl.dataset.pollInterval;
          if(pollInterval) clearInterval(parseInt(pollInterval));
          form.style.display = 'none'; // Hide the form
          return;
        }
        if(!resp.ok){
          console.warn('Failed to load messages', resp.status);
          return;
        }
        const data = await resp.json();
        console.log('API response data:', data);
        // Get user permissions for this salon
        userPermissions = await getUserPermissions(chatSlug);
        console.log('About to render messages with permissions:', userPermissions, 'and messages:', data.messages?.length || 0);
        renderMessages(messagesEl, data.messages || [], userPermissions);
      }catch(e){
        console.error(e);
      }
    }

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const value = input.value.trim();
      const file = fileInput ? fileInput.files[0] : null;
      
      if(!value && !file) return;

      // disable while sending
      input.disabled = true;
      if (form.querySelector('button[type="submit"]')) {
        form.querySelector('button[type="submit"]').disabled = true;
      }

      try{
        let body;
        let headers = {
          'X-CSRFToken': csrftoken,
        };

        if (file) {
          // Use FormData for file uploads
          body = new FormData();
          if (value) body.append('contenu', value);
          body.append('fichier', file);
        } else {
          // Use JSON for text-only messages
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify({contenu: value});
        }

        const resp = await fetch(buildUrl(sendUrl), {
          method: 'POST',
          credentials: 'same-origin',
          headers: headers,
          body: body
        });

        if(resp.redirected){
          showAlert(messagesEl, 'Vous devez être connecté pour envoyer des messages.', 'warning');
          return;
        }

        if(resp.status === 404){
          showAlert(messagesEl, 'Ce salon/canal a été supprimé.', 'warning');
          form.style.display = 'none';
          return;
        }

        if(!resp.ok){
          let text = '';
          try{ text = await resp.text(); }catch(e){}
          showAlert(messagesEl, text || `Erreur lors de l'envoi (${resp.status})`);
          return;
        }

        // success — append returned message immediately
        const data = await resp.json();
        appendMessage(messagesEl, data, userPermissions);
        input.value = '';
        if (fileInput) fileInput.value = '';
        if (filePreview) filePreview.style.display = 'none';

        // refresh to ensure ordering
        setTimeout(load, 200);

      }catch(e){
        console.error(e);
        showAlert(messagesEl, 'Erreur réseau lors de l\'envoi.');
      }finally{
        input.disabled = false;
        if (form.querySelector('button[type="submit"]')) {
          form.querySelector('button[type="submit"]').disabled = false;
        }
      }
    });

    // initial load + polling
    load();
    const pollInterval = setInterval(load, 3000);
    
    // Attach listeners to existing buttons after initial load
    attachListeners(messagesEl);
    
    // Store the interval so we can clear it if needed
    messagesEl.dataset.pollInterval = pollInterval;
  }

  // Moderation functions
  async function loadUsers(salonSlug) {
    try {
      const resp = await fetch(buildUrl(`api/salon/${salonSlug}/users/`), {credentials: 'same-origin'});
      if (!resp.ok) {
        console.error('Failed to load users');
        return;
      }
      const data = await resp.json();
      renderUsersList(data.users || []);
    } catch (e) {
      console.error('Error loading users:', e);
    }
  }

  function renderUsersList(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    usersList.innerHTML = '';
    users.forEach(user => {
      const item = document.createElement('a');
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
      item.href = '#';
      item.setAttribute('data-user-id', user.id);
      item.setAttribute('data-username', user.username);

      let badges = '';
      if (user.is_admin) badges += '<span class="badge bg-danger">Admin</span> ';
      else if (user.is_moderator) badges += '<span class="badge bg-warning">Mod</span> ';
      if (user.is_banned) badges += '<span class="badge bg-dark">Banni</span>';

      item.innerHTML = `
        <span>${escapeHtml(user.username)}</span>
        <span>${badges}</span>
      `;

      item.addEventListener('click', (e) => {
        e.preventDefault();
        selectUser(user);
      });

      usersList.appendChild(item);
    });
  }

  function selectUser(user) {
    const userActions = document.getElementById('userActions');
    const selectedUser = document.getElementById('selectedUser');
    const banBtn = document.getElementById('banBtn');
    const unbanBtn = document.getElementById('unbanBtn');
    const promoteBtn = document.getElementById('promoteBtn');
    const demoteBtn = document.getElementById('demoteBtn');

    if (!userActions || !selectedUser) return;

    selectedUser.textContent = user.username;
    userActions.style.display = 'block';

    // Update button visibility based on user status
    if (user.is_banned) {
      banBtn.style.display = 'none';
      unbanBtn.style.display = 'block';
    } else {
      banBtn.style.display = 'block';
      unbanBtn.style.display = 'none';
    }

    // Hide promote/demote buttons if current user is not admin
    if (promoteBtn && demoteBtn) {
      // Check if current user is admin (we'll get this from permissions)
      const salonSlug = window.CHAT_SLUG || window.CHAT_SALON_SLUG;
      getUserPermissions(salonSlug).then(permissions => {
        if (permissions.is_admin) {
          if (user.is_moderator && !user.is_admin) {
            promoteBtn.style.display = 'none';
            demoteBtn.style.display = 'block';
          } else if (!user.is_admin) {
            promoteBtn.style.display = 'block';
            demoteBtn.style.display = 'none';
          } else {
            promoteBtn.style.display = 'none';
            demoteBtn.style.display = 'none';
          }
        } else {
          promoteBtn.style.display = 'none';
          demoteBtn.style.display = 'none';
        }
      });
    }

    // Store selected user ID
    userActions.setAttribute('data-selected-user-id', user.id);
  }

  async function banUser(salonSlug, userId, reason = '') {
    try {
      const resp = await fetch(buildUrl(`api/salon/${salonSlug}/ban/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ user_id: userId, reason: reason })
      });

      const data = await resp.json();
      if (resp.ok) {
        showAlert(document.getElementById('messages'), data.message || 'Utilisateur banni.', 'success');
        loadUsers(salonSlug); // Refresh user list
      } else {
        showAlert(document.getElementById('messages'), data.error || 'Erreur lors du bannissement.', 'danger');
      }
    } catch (e) {
      console.error('Error banning user:', e);
      showAlert(document.getElementById('messages'), 'Erreur réseau.', 'danger');
    }
  }

  async function unbanUser(salonSlug, userId) {
    try {
      const resp = await fetch(buildUrl(`api/salon/${salonSlug}/unban/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ user_id: userId })
      });

      const data = await resp.json();
      if (resp.ok) {
        showAlert(document.getElementById('messages'), data.message || 'Utilisateur débanni.', 'success');
        loadUsers(salonSlug); // Refresh user list
      } else {
        showAlert(document.getElementById('messages'), data.error || 'Erreur lors du débannissement.', 'danger');
      }
    } catch (e) {
      console.error('Error unbanning user:', e);
      showAlert(document.getElementById('messages'), 'Erreur réseau.', 'danger');
    }
  }

  async function promoteUser(salonSlug, userId) {
    try {
      const resp = await fetch(buildUrl(`api/salon/${salonSlug}/promote/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ user_id: userId, role: 'moderator' })
      });

      const data = await resp.json();
      if (resp.ok) {
        showAlert(document.getElementById('messages'), data.message || 'Utilisateur promu.', 'success');
        loadUsers(salonSlug); // Refresh user list
      } else {
        showAlert(document.getElementById('messages'), data.error || 'Erreur lors de la promotion.', 'danger');
      }
    } catch (e) {
      console.error('Error promoting user:', e);
      showAlert(document.getElementById('messages'), 'Erreur réseau.', 'danger');
    }
  }

  async function demoteUser(salonSlug, userId) {
    try {
      const resp = await fetch(buildUrl(`api/salon/${salonSlug}/demote/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ user_id: userId })
      });

      const data = await resp.json();
      if (resp.ok) {
        showAlert(document.getElementById('messages'), data.message || 'Utilisateur rétrogradé.', 'success');
        loadUsers(salonSlug); // Refresh user list
      } else {
        showAlert(document.getElementById('messages'), data.error || 'Erreur lors de la rétrogradation.', 'danger');
      }
    } catch (e) {
      console.error('Error demoting user:', e);
      showAlert(document.getElementById('messages'), 'Erreur réseau.', 'danger');
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    if(window.CHAT_CHANNEL_SLUG && window.CHAT_SALON_SLUG) {
      start(window.CHAT_SALON_SLUG, window.CHAT_CHANNEL_SLUG);
    } else if(window.CHAT_SLUG) {
      start(window.CHAT_SLUG);
    } else {
      console.error('No chat slug found');
    }

    // Hide moderation button if user doesn't have permissions
    setTimeout(async () => {
      const salonSlug = window.CHAT_SLUG || window.CHAT_SALON_SLUG;
      if (salonSlug) {
        const permissions = await getUserPermissions(salonSlug);
        const moderationBtn = document.getElementById('moderationBtn');
        if (moderationBtn && !permissions.can_moderate) {
          moderationBtn.style.display = 'none';
        }
      }
    }, 1000); // Wait for initial load

    // Moderation panel handling
    const moderationBtn = document.getElementById('moderationBtn');
    const moderationPanel = document.getElementById('moderationPanel');

    if (moderationBtn && moderationPanel) {
      moderationBtn.addEventListener('click', () => {
        // Load users when opening the panel
        const salonSlug = window.CHAT_SLUG || window.CHAT_SALON_SLUG;
        if (salonSlug) {
          loadUsers(salonSlug);
        }

        // Show modal
        const modal = new bootstrap.Modal(moderationPanel);
        modal.show();
      });
    }

    // Moderation action buttons
    const banBtn = document.getElementById('banBtn');
    const unbanBtn = document.getElementById('unbanBtn');
    const promoteBtn = document.getElementById('promoteBtn');
    const demoteBtn = document.getElementById('demoteBtn');
    const userActions = document.getElementById('userActions');

    if (banBtn) {
      banBtn.addEventListener('click', () => {
        const salonSlug = window.CHAT_SLUG || window.CHAT_SALON_SLUG;
        const userId = userActions.getAttribute('data-selected-user-id');
        if (salonSlug && userId) {
          const reason = prompt('Raison du bannissement (optionnel):');
          banUser(salonSlug, userId, reason || '');
        }
      });
    }

    if (unbanBtn) {
      unbanBtn.addEventListener('click', () => {
        const salonSlug = window.CHAT_SLUG || window.CHAT_SALON_SLUG;
        const userId = userActions.getAttribute('data-selected-user-id');
        if (salonSlug && userId) {
          unbanUser(salonSlug, userId);
        }
      });
    }

    if (promoteBtn) {
      promoteBtn.addEventListener('click', () => {
        const salonSlug = window.CHAT_SLUG || window.CHAT_SALON_SLUG;
        const userId = userActions.getAttribute('data-selected-user-id');
        if (salonSlug && userId) {
          promoteUser(salonSlug, userId);
        }
      });
    }

    if (demoteBtn) {
      demoteBtn.addEventListener('click', () => {
        const salonSlug = window.CHAT_SLUG || window.CHAT_SALON_SLUG;
        const userId = userActions.getAttribute('data-selected-user-id');
        if (salonSlug && userId) {
          demoteUser(salonSlug, userId);
        }
      });
    }
  });

})();
