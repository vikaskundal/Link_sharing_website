(function () {
  "use strict";

  var Api = window.PaperApi;
  var Auth = window.PaperAuth;
  var PaperLink = window.PaperLink;

  PaperLink.initNav();

  var listEl = document.getElementById("links-list");
  var loadingEl = document.getElementById("links-loading");
  var emptyEl = document.getElementById("links-empty");
  var errorEl = document.getElementById("links-error");
  var userRatings = {}; // linkId -> true | false

  function setSort(sort) {
    document.querySelectorAll(".btn-tab").forEach(function (b) {
      b.classList.toggle("active", b.dataset.sort === sort);
    });
    loadLinks(sort);
  }

  function loadLinks(sort) {
    loadingEl.hidden = false;
    listEl.hidden = true;
    emptyEl.hidden = true;
    errorEl.hidden = true;
    Api.getLinks(sort).then(function (res) {
      loadingEl.hidden = true;
      var links = res.links || [];
      listEl.innerHTML = "";
      if (links.length === 0) {
        emptyEl.hidden = false;
        return;
      }
      listEl.hidden = false;
      var loggedIn = Auth.isLoggedIn();
      links.forEach(function (link) {
        var ur = userRatings[link.id];
        var card = PaperLink.linkCard(link, ur, false, loggedIn ? onRate : null, loggedIn ? onHide : null);
        listEl.appendChild(card);
      });
    }).catch(function (err) {
      loadingEl.hidden = true;
      errorEl.textContent = err.message || "Could not load links.";
      errorEl.hidden = false;
    });
  }

  function onRate(id, positive) {
    Api.rateLink(id, positive).then(function (res) {
      userRatings[id] = res.userRating;
      var card = listEl.querySelector('[data-link-id="' + id + '"]');
      if (card) PaperLink.updateLinkCard(card, res.link, res.userRating);
    }).catch(function (err) {
      alert(err.message || "Could not rate.");
    });
  }

  function onHide(id) {
    Api.hideLink(id).then(function () {
      var card = listEl.querySelector('[data-link-id="' + id + '"]');
      if (card) card.remove();
      var remaining = listEl.querySelectorAll(".link-card").length;
      if (remaining === 0) {
        listEl.hidden = true;
        emptyEl.hidden = false;
        emptyEl.innerHTML = "No more links to show.";
      }
    }).catch(function (err) {
      alert(err.message || "Could not hide.");
    });
  }

  document.querySelectorAll(".btn-tab").forEach(function (b) {
    b.addEventListener("click", function () { setSort(b.dataset.sort); });
  });

  setSort("recent");
})();
