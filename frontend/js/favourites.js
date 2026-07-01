(function () {
  "use strict";
  if (!PaperAuth.requireAuth()) return;
  PaperLink.initNav();

  var listEl = document.getElementById("fav-list");
  var loadingEl = document.getElementById("fav-loading");
  var emptyEl = document.getElementById("fav-empty");
  var errorEl = document.getElementById("fav-error");
  var userRatings = {}; // linkId -> true | false; all start as true here

  function load() {
    loadingEl.hidden = false;
    listEl.hidden = true;
    emptyEl.hidden = true;
    errorEl.hidden = true;
    PaperApi.getFavourites().then(function (res) {
      loadingEl.hidden = true;
      var links = res.links || [];
      listEl.innerHTML = "";
      if (links.length === 0) {
        emptyEl.hidden = false;
        return;
      }
      listEl.hidden = false;
      links.forEach(function (link) {
        userRatings[link.id] = true;
        var card = PaperLink.linkCard(link, true, true, onRate, onHide);
        listEl.appendChild(card);
      });
    }).catch(function (err) {
      loadingEl.hidden = true;
      errorEl.textContent = err.message || "Could not load favourites.";
      errorEl.hidden = false;
    });
  }

  function onRate(id, positive) {
    PaperApi.rateLink(id, positive).then(function (res) {
      userRatings[id] = res.userRating;
      var card = listEl.querySelector('[data-link-id="' + id + '"]');
      if (card) {
        PaperLink.updateLinkCard(card, res.link, res.userRating);
        if (!positive) {
          card.remove();
          var left = listEl.querySelectorAll(".link-card").length;
          if (left === 0) {
            listEl.hidden = true;
            emptyEl.hidden = false;
          }
        }
      }
    }).catch(function (err) {
      alert(err.message || "Could not rate.");
    });
  }

  function onHide(id) {
    PaperApi.hideLink(id).then(function () {
      var card = listEl.querySelector('[data-link-id="' + id + '"]');
      if (card) card.remove();
      var left = listEl.querySelectorAll(".link-card").length;
      if (left === 0) {
        listEl.hidden = true;
        emptyEl.hidden = false;
      }
    }).catch(function (err) {
      alert(err.message || "Could not hide.");
    });
  }

  load();
})();
