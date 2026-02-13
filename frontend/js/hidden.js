(function () {
  "use strict";
  if (!PaperAuth.requireAuth()) return;
  PaperLink.initNav();

  var listEl = document.getElementById("hidden-list");
  var loadingEl = document.getElementById("hidden-loading");
  var emptyEl = document.getElementById("hidden-empty");
  var errorEl = document.getElementById("hidden-error");

  function load() {
    loadingEl.hidden = false;
    listEl.hidden = true;
    emptyEl.hidden = true;
    errorEl.hidden = true;
    PaperApi.getHiddenLinks().then(function (res) {
      loadingEl.hidden = true;
      var links = res.links || [];
      listEl.innerHTML = "";
      if (links.length === 0) {
        emptyEl.hidden = false;
        return;
      }
      listEl.hidden = false;
      links.forEach(function (link) {
        var card = PaperLink.linkCard(link, null, false, null, null);
        listEl.appendChild(card);
      });
    }).catch(function (err) {
      loadingEl.hidden = true;
      errorEl.textContent = err.message || "Could not load hidden links.";
      errorEl.hidden = false;
    });
  }

  load();
})();
