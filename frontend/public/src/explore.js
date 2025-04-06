const projectsGrid = document.getElementById("projectsGrid");
const filterButton = document.getElementById("filterButton");

async function fetchProjects(filter) {
    filterButton.innerHTML = `Filter: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`;
    try {
        const response = await fetch(`/projects/public?filter=${filter}`);

        if (!response.ok) {
            const error = await response.json();
            console.error("Fehler vom Server:", error);
            projectsGrid.innerHTML = '<h4 class="m-auto mt-4">Error: ' + (error.error || "Undefined") + '</h4>';
            return;
        }

        const projects = await response.json();

        if (!Array.isArray(projects)) {
            console.error("Unerwartete Antwort vom Server:", projects);
            projectsGrid.innerHTML = '<h4 class="m-auto mt-4">Fehler beim Laden der Projekte.</h4>';
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
                    <div class="card-voter">
                        <div>
                            <span class="view-count">${project.views || 0} views</span>
                        </div>
                        <div>
                            <button class="btn btn-primary" onclick="previewProject(${project.id}, ${project.user_id})">Preview</button>
                        </div>
                    </div>
                </div>
            `;

            projectsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

fetchProjects('latest');


function previewProject(projectId, user_id) {
    console.log(user_id);
    window.location.href = `/projects/${projectId}?user_id=${user_id}`;
}