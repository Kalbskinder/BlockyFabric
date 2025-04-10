document.addEventListener("DOMContentLoaded", function() {
    const container = document.getElementById("container");
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    fetchProfile(id, container);
});

async function fetchProfile(userId, container) {
    console.log(userId);
    try {
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
            throw new Error(response.error || "User not found");
        }

        const user = await response.json();

        const profileImage = user.profileImage ? user.profileImage : "/images/default-profile.png";
        const username = user.username || "Unknown User";

        container.innerHTML = `
            <h2 class="mb-3">${username}'s Profile</h2>
            <div class="profile-image-preview">
                <img id="preview-img" src="${profileImage}" alt="Profile Image">
            </div>
            <h3 class="mt-4">${username}</h3>
            <br>
            <h2>Projects</h2>
        `;
    } catch (error) {
        console.error("Error fetching profile:", error);
        container.innerHTML = "<p>Error loading profile.</p>";
    }
}