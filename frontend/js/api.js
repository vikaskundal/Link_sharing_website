(function () {
  "use strict";

  const A = window.PaperAuth;

  function apiFetch(path, options) {
    options = options || {};
    const headers = Object.assign({ "Content-Type": "application/json" }, A.getAuthHeaders(), options.headers || {});
    return fetch(path, Object.assign({ headers }, options)).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (body) {
          const err = new Error(body.error || "Request failed");
          err.status = res.status;
          err.body = body;
          throw err;
        }).catch(function (e) {
          if (e && e.status) throw e;
          throw new Error(res.statusText || "Request failed");
        });
      }
      return res.json();
    });
  }

  window.PaperApi = {
    getLinks(sort) {
      const q = sort === "rated" ? "?sort=rated" : "";
      return apiFetch("/api/links" + q);
    },

    addLink(title, description, url) {
      return apiFetch("/api/links", {
        method: "POST",
        body: JSON.stringify({ title, description, url }),
      });
    },

    rateLink(id, positive) {
      return apiFetch("/api/links/" + id + "/rate", {
        method: "POST",
        body: JSON.stringify({ positive: !!positive }),
      });
    },

    hideLink(id) {
      return apiFetch("/api/links/" + id + "/hide", { method: "POST" });
    },

    getFavourites() {
      return apiFetch("/api/links/favourites");
    },

    getHiddenLinks() {
      return apiFetch("/api/links/hidden");
    },

    getMe() {
      return apiFetch("/api/members/me");
    },

    login(username, password) {
      return apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },

    signup(username, password) {
      return apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },
  };
})();
