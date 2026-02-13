(function () {
  "use strict";
  if (!PaperAuth.requireAuth()) return;
  PaperLink.initNav();

  var form = document.getElementById("add-link-form");
  var errEl = document.getElementById("add-link-error");
  var okEl = document.getElementById("add-link-success");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errEl.hidden = true;
    okEl.hidden = true;
    var title = form.title.value.trim();
    var desc = form.description.value.trim();
    var url = form.url.value.trim();
    if (!title || !desc) {
      errEl.textContent = "Title and description required.";
      errEl.hidden = false;
      return;
    }
    if (!url) {
      errEl.textContent = "Link URL is required.";
      errEl.hidden = false;
      return;
    }
    PaperApi.addLink(title, desc, url).then(function () {
      okEl.innerHTML = 'Link posted! <a href="/">View front page</a>';
      okEl.hidden = false;
      form.title.value = "";
      form.description.value = "";
      form.url.value = "";
    }).catch(function (err) {
      errEl.textContent = err.message || "Failed to post link.";
      errEl.hidden = false;
    });
  });
})();
