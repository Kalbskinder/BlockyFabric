document.getElementById("file-input").addEventListener("change", function(event) {
    const file = event.target.files[0];
    const fileNameDisplay = document.getElementById("file-name");
    const previewImg = document.getElementById("preview-img");

    if (file) {
        fileNameDisplay.textContent = file.name; // Datei-Name anzeigen
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result; // Vorschau aktualisieren
        };
        reader.readAsDataURL(file);
    } else {
        fileNameDisplay.textContent = "";
    }
});

document.getElementById("upload-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById("file-input");
    
    if (fileInput.files.length === 0) {
        const errorElement = document.getElementById("filesize-error");
            errorElement.style.display = "block";
            errorElement.textContent = "Please select a file";
        return;
    }

    formData.append("profileImage", fileInput.files[0]);

    try {
        const response = await fetch("/upload/upload-profile-image", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            const errorElement = document.getElementById("filesize-error");
            errorElement.style.display = "block";
            errorElement.textContent = data.error;
            console.log(data.error)
            return;
        }

        window.location.reload();
    } catch (error) {
        console.error("Fehler beim Hochladen:", error);
    }
});