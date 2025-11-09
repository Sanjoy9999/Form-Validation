(function () {
  function getSessionUser() {
    try {
      const raw = localStorage.getItem("sessionUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function logout() {
    localStorage.removeItem("sessionUser");
    window.location.href = "login.html";
  }

  //DateOfBirth
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const user = getSessionUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const details = document.getElementById("details");
    const rows = [
      ["Name", user.name || "—"],
      ["Email", user.email || "—"],
      ["Phone", user.phone || "—"],
      ["DOB", user.dob ? formatDate(user.dob) : "—"],
      ["Role", user.role ? `<span class="badge">${user.role}</span>` : "—"],
      ["Gender", user.gender || "—"],
      ["Volume", user.volume || "—"],
      [
        "Color",
        user.color
          ? `<span class="color-swatch" style="background:${user.color}"></span> ${user.color}`
          : "—",
      ],
      [
        "Uploaded File",
        user.fileData
          ? user.fileType === "application/pdf"
            ? `<div class="file-preview">
                <embed src="${user.fileData}" type="application/pdf" width="100%" height="400px" />
                <p class="file-name">📄 ${user.fileName || "document.pdf"}</p>
              </div>`
            : `<div class="file-preview">
                <img src="${user.fileData}" alt="${user.fileName || "uploaded image"}" style="max-width: 100%; max-height: 400px; border-radius: 8px;" />
                <p class="file-name">🖼️ ${user.fileName || "image"}</p>
              </div>`
          : "—",
      ],
      ["Policy Accepted", user.policy ? "Yes" : "No"],
      [
        "Registered",
        user.createdAt ? new Date(user.createdAt).toLocaleString() : "—",
      ],
    ];

    details.innerHTML = rows
      .map(
        ([k, v]) => `
      <div class="${k === "Uploaded File" ? "file-label" : ""}">${k === "Uploaded File" ? "<strong>" + k + "</strong>" : "<strong>" + k + "</strong>"}</div>
      
      <div class="${k === "Uploaded File" && user.fileData ? "file-content" : ""}">${v}</div>
    `
      )
      .join("");

    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn.addEventListener("click", logout);
  });
})();
