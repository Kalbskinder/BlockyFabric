const projectsGrid = document.getElementById("projectsGrid");
const newProjectModal = new bootstrap.Modal(document.getElementById("newMod"));
const deletionModalDiv = document.getElementById("deleteModModal");
const fileInput = document.getElementById("file-input");
const fileNameDisplay = document.getElementById("file-name");
const errorElement = document.getElementById("filesize-error");
const errorSlideInText = document.getElementById("error-slidein-text");
const errorSlideInElement = document.getElementById("error-slidein");
const radioPrivate = document.getElementById("radio-private");
const radioPublic = document.getElementById("radio-public");

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
    const minecraft_version = "1.21.5";

    console.log('Private', radioPrivate.checked, 'Public', radioPublic.checked);

    if (radioPrivate.checked) {
        visibility = "private";
    } else if (radioPublic.checked) {
        visibility = "public";
    } else {
        visibility = "private";
    }

    if (!name || !minecraft_version) {
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("minecraft_version", minecraft_version);
    formData.append("visibility", visibility);

    if (fileInput.files.length > 0) {
        formData.append("banner", fileInput.files[0]);
    }

    try {
        const response = await fetch("/projects/create", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            fetchProjects();
        } else {
            throw new Error(result.error || "Fehler beim Erstellen des Projekts.");
        }
    } catch (error) {
        console.error("Fehler:", error.message);
        if (error.message === "You can't have more than 4 projects.") {
            errorSlideInText.textContent = error.message;
            
            errorSlideInElement.style.visibility = "hidden";
            errorSlideInElement.style.opacity = "0"; 
            errorSlideInElement.style.animation = "none"; 
    
            setTimeout(() => {
                errorSlideInElement.style.animation = "slidein 3s ease-in-out";
    
                errorSlideInElement.style.visibility = "visible";
                errorSlideInElement.style.opacity = "1";
            }, 50);
            
            setTimeout(() => {
                errorSlideInElement.style.visibility = "hidden";
                errorSlideInElement.style.opacity = "0";
            }, 3000);
            return;
        }
        errorElement.style.display = "block";
        errorElement.textContent = error.message;
    }    
}

async function deleteProject(id) {
    const response = await fetch(`/projects/delete/${id}`, { method: "DELETE" });
    if (response.ok) {
        fetchProjects();
        closeModal('deleteMod');
    } else {
        alert('Something went wrong.');
    }
}

async function deletionModal(id) {
    const response = await fetch(`/projects/get/${id}`);
    const project = await response.json();

    deletionModalDiv.innerHTML = `
    <div class="modal fade" tabindex="-1" id="deleteMod">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Delete confirmation</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete <span class="mod-name">${project.name}</span>?</p>
                </div>
        
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" onclick="deleteProject(${id})">Delete</button>
                </div>
            </div>
        </div>
    </div>
    `;

    const deleteModalInstance = new bootstrap.Modal(document.getElementById("deleteMod"));
    deleteModalInstance.show();
}

function closeModal(domId) {
    const modalElement = document.getElementById(domId);
    const modalInstance = bootstrap.Modal.getInstance(modalElement);

    if (modalInstance) {
        modalInstance.hide();
        setTimeout(() => {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
        }, 200);
    }
}

function deleteModalContent() {
    fileNameDisplay.innerHTML = "";
    errorElement.innerHTML = "";
}

fileInput.addEventListener("change", function(event) {
    const file = event.target.files[0];

    errorElement.style.display = "none";
    errorElement.textContent = "";

    if (file) {
        if (file.size > 1 * 1024 * 1024) { // 1MB Limit
            errorElement.style.display = "block";
            errorElement.textContent = "File to large. Up to 1MB allowed.";
            fileInput.value = "";
            return;
        }
        fileNameDisplay.textContent = file.name;
    } else {
        fileNameDisplay.textContent = "";
    }
});

document.addEventListener("DOMContentLoaded", fetchProjects);
