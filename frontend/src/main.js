document.addEventListener("DOMContentLoaded", function () {
    loadComponent("navbar", "frontend/components/navbar.html");
});

function loadComponent(targetId, filePath) {
    fetch(filePath)
        .then(response => response.text())
        .then(html => {
            document.getElementById(targetId).innerHTML = html;
        })
        .catch(error => console.error(`Fehler beim Laden von ${filePath}:`, error));
}
