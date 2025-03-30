const projectsGrid = document.getElementById("projectsGrid");
const newProjectModal =  new bootstrap.Modal(document.getElementById("newMod"));
const deletionModalDiv = document.getElementById("deleteModModal");

async function fetchProjects() {
    try {
        const response = await fetch(`/projects/get`);
        const projects = await response.json();
        if (projects.length === 0) {
            projectsGrid.innerHTML = '<h4 class="m-auto mt-4">No projects found.</h4>';
            return;
        }

        projectsGrid.innerHTML = "";
        projects.forEach(project => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <img src="${project.banner || './images/icons/placeholder.png'}" class="card-img-top" alt="Project Image">
                <div class="card-body">
                    <h5 class="card-title">${project.name}</h5>
                    <p class="card-text">${project.description || "No description"}</p>
                    <div class="alg-right">
                        <button class="btn btn-primary" onclick="editProject(${project.id})">Edit</button>
                        <button class="btn btn-danger" onclick="deletionModal(${project.id})">Delete</button>
                    </div>
                </div>
            `;

            projectsGrid.appendChild(card);
        });
        closeModal('newMod');
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

async function createNewMod() {
    const name = document.getElementById("modName").value;
    const description = document.getElementById("modDescription").value;
    const fileInput = document.getElementById("file-input");
    const minecraft_version = "1.21.5";

    if (!name || !minecraft_version) {
        alert("Bitte gib einen Namen und eine Minecraft-Version an.");
        return;
    }

    // FormData-Objekt erstellen, um Datei und JSON-Daten zu senden
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("minecraft_version", minecraft_version);

    if (fileInput.files.length > 0) {
        formData.append("banner", fileInput.files[0]); // Bild hinzufügen
    }

    const response = await fetch("/projects/create", {
        method: "POST",
        body: formData, // FormData statt JSON senden
    });

    const result = await response.json();
    if (result.success) {
        fetchProjects(); // Aktualisiere die Liste der Projekte
    } else {
        console.error("Fehler:", result.error);
    }
}

async function deleteProject(id) {
    const response = await fetch(`/projects/delete/${id}`, { method: "DELETE" });
    if (response.ok) {
        fetchProjects(); // Fetch projects to show changes
        closeModal('deleteMod'); // Close modal after deletion
    } else {
        alert('Something went wrong.')
    }
}

async function deletionModal(id) {
    const response = await fetch(`/projects/get/${id}`);
    const projects = await response.json();
    deletionModalDiv.innerHTML = `
    <div class="modal fade" tabindex="-1" id="deleteMod">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Delete confirmation</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete <span class="mod-name">${projects.name}</span>?</p>
                </div>
        
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" onclick="deleteProject(${id})">Delete</button>
                </div>
            </div>
        </div>
    </div>
    `;
    const newProjectModal =  new bootstrap.Modal(document.getElementById("deleteMod"));
    newProjectModal.show();
}

function closeModal(domId) {
    const modalElement = document.getElementById(domId);
    const modalInstance = bootstrap.Modal.getInstance(modalElement);

    if (modalInstance) {
        modalInstance.hide();
        setTimeout(() => {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
        }, 200); // Warte kurz, damit Bootstrap seine Animation abschließen kann
    }
}

fetchProjects();

document.addEventListener("DOMContentLoaded", fetchProjects);