(function () {
  "use strict";

  const TOKEN_KEY = "paperlink_token";
  const USERNAME_KEY = "paperlink_username";

  window.PaperAuth = {
    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token) {
      localStorage.setItem(TOKEN_KEY, token || "");
    },

    setUsername(username) {
      if (username) localStorage.setItem(USERNAME_KEY, username);
      else localStorage.removeItem(USERNAME_KEY);
    },

    getUsername() {
      return localStorage.getItem(USERNAME_KEY);
    },

    clear() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
    },

    isLoggedIn() {
      return !!localStorage.getItem(TOKEN_KEY);
    },

    requireAuth() {
      if (!this.isLoggedIn()) {
        window.location.href = "/login.html?next=" + encodeURIComponent(window.location.pathname + window.location.search);
        return false;
      }
      return true;
    },

    getAuthHeaders() {
      const t = this.getToken();
      return t ? { Authorization: "Bearer " + t } : {};
    },
  };
})();
