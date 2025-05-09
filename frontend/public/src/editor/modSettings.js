// Load current settings into the input field on opening the mod settings modal
// Save the settings when the save button is clicked
// Will not be adding button for deleting a mod. This can be done via the dashboard (/dashboard)

async function loadModSettings() {
    const params = new URLSearchParams(window.location.search);
    const modId = parseInt(params.get("id"));
    const modName = document.getElementById("modName");
    const modDescription = document.getElementById("modDescription");
    const modVisibilityPublic = document.getElementById("radio-public");
    const modVisibilityPrivate = document.getElementById("radio-private");

    try {
        const response = await fetch("/api/getSettings/" + modId);
        
        if (!response.ok) {
            throw new Error("Error while loading mod settings");
        }

        const data = await response.json();

        modName.value = data.name;
        modDescription.value = data.description;
        modVisibilityPublic.checked = data.visibility === "public";
        modVisibilityPrivate.checked = data.visibility === "private";

    } catch (error) {
        console.error("Error while loading mod settings: ", error);
    }
}

async function saveModSettings() {
    const params = new URLSearchParams(window.location.search);
    const modId = parseInt(params.get("id"));
    const modName = document.getElementById("modName").value;
    const modDescription = document.getElementById("modDescription").value;
    const modVisibilityPublic = document.getElementById("radio-public").checked;
    const bannerInput = document.getElementById("file-input");

    if (isNaN(modId)) {
        console.error("Invalid mod ID");
        return;
    }

    let body;
    let headers = {};

    if (bannerInput && bannerInput.files.length > 0) {
        body = new FormData();
        body.append("project_id", modId);
        body.append("name", modName);
        body.append("description", modDescription);
        body.append("visibility", modVisibilityPublic ? "public" : "private");
        body.append("banner", bannerInput.files[0]);
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
            project_id: modId,
            name: modName,
            description: modDescription,
            visibility: modVisibilityPublic ? "public" : "private"
        });        
    }

    try {
        const response = await fetch("/projects/update", {
            method: "POST",
            headers,
            body
        });

        if (!response.ok) { 
            throw new Error("Error while saving mod settings");
        }
        await saveWorkspace(); // Save the workspace state after saving mod settings
        window.location.href = `/editor?id=${modId}`;
    } catch (error) {
        console.error("Error while saving mod settings: ", error);
    }
}


// File upload
// Display the file name if a file was uploaded

const fileInput = document.getElementById("file-input");
const fileNameDisplay = document.getElementById("file-name");
const errorElement = document.getElementById("filesize-error");

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

loadModSettings();