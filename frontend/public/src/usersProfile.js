document.addEventListener("DOMContentLoaded", function() {
    const container = document.getElementById("container");
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    fetchProfile(id, container);
});

async function fetchProfile(userId, container) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new Error("User not found");
        }

        const user = await response.json();
        const projectsResponse = await fetch(`/api/getproject/${user.id}`);
        const projects = await projectsResponse.json();

        const profileImage = user.profileImage || "/images/default-profile.png";
        const username = user.username || "Unknown User";

        let projectCards = projects.map(project => `
            <div class="card mb-3">
                <img src="${project.banner || './images/icons/placeholder.png'}" class="card-img-top" alt="Project Image">
                <div class="card-body">
                    <h5 class="card-title">${project.name}</h5>
                    <p class="card-text">${project.description || "No description"}</p>
                    <div class="card-voter d-flex justify-content-between">
                        <span class="view-count">${project.views || 0} views</span>
                        <button class="btn btn-primary" onclick="previewProject(${project.id}, ${project.user_id})">Preview</button>
                    </div>
                </div>
            </div>
        `).join("");

        if (!projectCards) {
            projectCards = '<p class="no-projects-found">No public projects found for this user</p>';
        }        

        container.innerHTML = `
            <h2 class="mb-3">${username}'s Profile</h2>
            <div class="profile-image-preview mb-4">
                <img id="preview-img" src="${profileImage}" alt="Profile Image">
            </div>
            <h3>Projects</h3>
            <div class="profile-projects-container">
                ${projectCards}
            </div>
        `;
    } catch (error) {
        console.error("Error fetching profile:", error);
        container.innerHTML = "<p>Error loading profile.</p>";
    }
}

function previewProject(projectId, user_id) {
    console.log(user_id);
    window.location.href = `/projects/${projectId}?user_id=${user_id}`;
}