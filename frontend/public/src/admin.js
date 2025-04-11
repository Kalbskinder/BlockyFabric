document.addEventListener("DOMContentLoaded", async function () {
    const userTableBody = document.getElementById("userTableBody");
    const deleteModal = document.getElementById("deleteModal");
    const confirmDeleteButton = document.getElementById("confirmDelete");
    const cancelDeleteButton = document.getElementById("cancelDelete");

    let selectedUserId = null;

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
                <td><a href="/users?id=${user.id}"><img src="${user.profileImage}" alt="Profilbild" class="profile-img"></a></td>
                <td><button class="btn btn-danger delete-btn" data-id="${user.id}">Löschen</button></td>
            `;
            userTableBody.appendChild(row);
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                selectedUserId = this.getAttribute("data-id");
                deleteModal.style.display = "block";
            });
        });
    }

    confirmDeleteButton.addEventListener("click", async function () {
        if (selectedUserId) {
            await fetch(`/admin/users/${selectedUserId}`, { method: "DELETE" });
            deleteModal.style.display = "none";
            loadUsers();
        }
    });

    cancelDeleteButton.addEventListener("click", function () {
        deleteModal.style.display = "none";
        selectedUserId = null;
    });

    loadUsers();
});
