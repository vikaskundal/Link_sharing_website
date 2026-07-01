(function () {
  "use strict";

  var A = window.PaperAuth;
  var Api = window.PaperApi;

  function initNav() {
    var nav = document.getElementById("main-nav");
    if (!nav) return;

    var loggedIn = A && A.isLoggedIn();
    var username = A && A.getUsername();

    var front = '<a href="/">Front page</a>';
    var signup = '<a href="/signup.html">Sign up</a>';
    var login = '<a href="/login.html">Log in</a>';
    var fav = '<a href="/favourites.html">Favourites</a>';
    var hidden = '<a href="/hidden.html">Hidden</a>';
    var user = username ? '<span class="nav-user">' + escapeHtml(username) + "</span>" : "";
    var logout = '<button type="button" class="btn btn-text" id="nav-logout">Log out</button>';

    if (loggedIn) {
      nav.innerHTML = front + " | " + fav + " | " + hidden + (user ? " | " + user : "") + " | " + logout;
      var btn = document.getElementById("nav-logout");
      if (btn) btn.addEventListener("click", function () { A.clear(); window.location.href = "/"; });
    } else {
      nav.innerHTML = front + " | " + signup + " | " + login;
    }
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
  }

  /** Build link card DOM. link + optional userRating (true/false), isFavourites. onRate(id, positive), onHide(id). */
  function linkCard(link, userRating, isFavourites, onRate, onHide) {
    var card = document.createElement("article");
    card.className = "link-card";
    card.dataset.linkId = String(link.id);

    var by = "By " + escapeHtml(link.username || "") + " · " + Number(link.points) + " Paper Points";
    var score = Number(link.aggregate_rating);
    var up = Number(link.positive_count);
    var down = Number(link.negative_count);
    var scoreStr = score >= 0 ? "+" + score : String(score);

    var html = "";
    html += '<header class="link-card-header">';
    var titleHtml = link.url ? '<a href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer" class="link-title-link">' + escapeHtml(link.title) + '</a>' : '<h2 class="link-title">' + escapeHtml(link.title) + "</h2>";
    html += titleHtml;
    html += '<p class="link-meta">' + by + " · " + formatDate(link.created_at) + "</p>";
    html += "</header>";
    html += '<p class="link-desc">' + escapeHtml(link.description) + "</p>";
    if (link.url) {
      html += '<p class="link-url"><a href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(link.url) + '</a></p>';
    }
    html += '<div class="link-footer">';
    html += '<span class="link-score" title="↑ ' + up + ' ↓ ' + down + '">' + scoreStr + "</span>";
    if (onRate) {
      var upCls = userRating === true ? " active" : "";
      var downCls = userRating === false ? " active" : "";
      html += '<button type="button" class="btn-rate btn-up' + upCls + '" data-positive="true" title="Rate up">↑</button>';
      html += '<button type="button" class="btn-rate btn-down' + downCls + '" data-positive="false" title="Rate down">↓</button>';
    }
    if (onHide) {
      html += '<button type="button" class="btn-hide">Hide</button>';
    }
    html += "</div>";

    card.innerHTML = html;

    if (onRate) {
      card.querySelectorAll(".btn-rate").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var pos = btn.dataset.positive === "true";
          onRate(link.id, pos);
        });
      });
    }
    if (onHide) {
      var hideBtn = card.querySelector(".btn-hide");
      if (hideBtn) hideBtn.addEventListener("click", function () { onHide(link.id); });
    }

    return card;
  }

  /** Update card with new link data and userRating. */
  function updateLinkCard(card, link, userRating) {
    var by = "By " + escapeHtml(link.username || "") + " · " + Number(link.points) + " Paper Points";
    var score = Number(link.aggregate_rating);
    var up = Number(link.positive_count);
    var down = Number(link.negative_count);
    var scoreStr = score >= 0 ? "+" + score : String(score);

    var header = card.querySelector(".link-card-header");
    if (header) {
      var meta = header.querySelector(".link-meta");
      if (meta) meta.textContent = by + " · " + formatDate(link.created_at);
      var titleEl = header.querySelector(".link-title, .link-title-link");
      if (titleEl && link.url) {
        titleEl.outerHTML = '<a href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer" class="link-title-link">' + escapeHtml(link.title) + '</a>';
      } else if (titleEl) {
        titleEl.textContent = link.title;
      }
    }
    var desc = card.querySelector(".link-desc");
    if (desc) desc.textContent = link.description;
    var urlEl = card.querySelector(".link-url");
    if (link.url) {
      if (!urlEl) {
        var urlP = document.createElement("p");
        urlP.className = "link-url";
        desc.parentNode.insertBefore(urlP, desc.nextSibling);
        urlEl = urlP;
      }
      urlEl.innerHTML = '<a href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(link.url) + '</a>';
    } else if (urlEl) {
      urlEl.remove();
    }
    var sc = card.querySelector(".link-score");
    if (sc) {
      sc.textContent = scoreStr;
      sc.title = "↑ " + up + " ↓ " + down;
    }
    card.querySelectorAll(".btn-rate").forEach(function (btn) {
      btn.classList.remove("active");
      if ((btn.dataset.positive === "true" && userRating === true) ||
          (btn.dataset.positive === "false" && userRating === false)) btn.classList.add("active");
    });
  }

  function initAddButton() {
    if (!A || !A.isLoggedIn()) return;
    var existing = document.getElementById("add-link-btn");
    if (existing) return;
    var btn = document.createElement("a");
    btn.id = "add-link-btn";
    btn.href = "/add-link.html";
    btn.className = "btn-add-link";
    btn.innerHTML = "+";
    btn.title = "Add new link";
    document.body.appendChild(btn);
  }

  window.PaperLink = {
    initNav: initNav,
    initAddButton: initAddButton,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    linkCard: linkCard,
    updateLinkCard: updateLinkCard,
  };
})();
