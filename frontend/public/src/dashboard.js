document.addEventListener("DOMContentLoaded", function () {
    const projectsGrid = document.getElementById("projectsGrid");

    // Simulated API Data (later you can fetch this from a server)
    const projects = [
        { id: 1, title: "My First Mod", description: "A cool Minecraft mod", image: "https://i.ytimg.com/vi/PeeV6Eki4IU/maxresdefault.jpg" },
        { id: 2, title: "Biome Generator", description: "Creates new biomes", image: "https://i.ytimg.com/vi/AMAf-oR6x5I/maxresdefault.jpg" },
        { id: 3, title: "New Tools", description: "Adds new tools to the game", image: "https://cdn.modrinth.com/data/6lvRWqbA/images/6291ebe10ccf3cfdbf288711a6e7e1e9433505a5.jpeg" },
        { id: 4, title: "Magic Blocks", description: "Magical blocks with special effects", image: "/images/icons/placeholder.png" }
    ];

    function loadProjects() {
        projectsGrid.innerHTML = ""; // Clear existing content
        projects.forEach(project => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <img src="${project.image}" class="card-img-top" alt="Project Image">
                <div class="card-body text-center">
                    <h5 class="card-title">${project.title}</h5>
                    <p class="card-text">${project.description}</p>
                    <button class="btn btn-primary" onclick="editProject(${project.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProject(${project.id})">Delete</button>
                </div>
            `;

            projectsGrid.appendChild(card);
        });
    }

    function editProject(id) {
        alert("Editing project " + id);
        // Redirect to an edit page later
        // window.location.href = `/edit-project.html?id=${id}`;
    }

    function deleteProject(id) {
        if (confirm("Are you sure you want to delete this project?")) {
            alert("Project " + id + " deleted!");
            // Later, send a delete request to the API
        }
    }

    loadProjects();
});
