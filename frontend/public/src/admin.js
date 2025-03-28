document.addEventListener("DOMContentLoaded", async function () {
    const userTableBody = document.getElementById("userTableBody");
    const deleteModal = document.getElementById("deleteModal");
    const confirmDeleteButton = document.getElementById("confirmDelete");
    const cancelDeleteButton = document.getElementById("cancelDelete");

    let selectedUserId = null;

    // 🔹 1. Benutzer abrufen & in die Tabelle einfügen
    async function loadUsers() {
        const response = await fetch('/admin/users');
        const users = await response.json();
        userTableBody.innerHTML = "";

        users.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><img src="${user.profileImage}" alt="Profilbild" class="profile-img"></td>
                <td><button class="btn btn-danger delete-btn" data-id="${user.id}">Löschen</button></td>
            `;
            userTableBody.appendChild(row);
        });

        // 🔹 2. Löschen-Button Event Listener hinzufügen
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                selectedUserId = this.getAttribute("data-id");
                deleteModal.style.display = "block"; // Popup anzeigen
            });
        });
    }

    // 🔹 3. Benutzer löschen nach Bestätigung
    confirmDeleteButton.addEventListener("click", async function () {
        if (selectedUserId) {
            await fetch(`/admin/users/${selectedUserId}`, { method: "DELETE" });
            deleteModal.style.display = "none";
            loadUsers(); // Tabelle neu laden
        }
    });

    // 🔹 4. Löschen abbrechen
    cancelDeleteButton.addEventListener("click", function () {
        deleteModal.style.display = "none";
        selectedUserId = null;
    });

    // 🔹 5. Benutzerliste beim Laden der Seite holen
    loadUsers();
});
