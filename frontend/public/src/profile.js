document.getElementById("file-input").addEventListener("change", function(event) {
    const file = event.target.files[0];
    const fileNameDisplay = document.getElementById("file-name");
    const previewImg = document.getElementById("preview-img");
    const errorElement = document.getElementById("filesize-error");

    // Reset error message on new file selection
    errorElement.style.display = "none";
    errorElement.textContent = "";

    if (file) {
        fileNameDisplay.textContent = file.name; // Show file name
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result; // Update preview image
        };
        reader.readAsDataURL(file);
    } else {
        fileNameDisplay.textContent = "";
        previewImg.src = ""; // Reset preview
    }
});

document.getElementById("upload-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById("file-input");
    const errorElement = document.getElementById("filesize-error");

    // Reset error message before upload
    errorElement.style.display = "none";
    errorElement.textContent = "";

    if (fileInput.files.length === 0) {
        errorElement.style.display = "block";
        errorElement.textContent = "Please select a file.";
        return;
    }

    const formData = new FormData();
    formData.append("profileImage", fileInput.files[0]);

    try {
        const response = await fetch("/upload/upload-profile-image", {
            method: "POST",
            body: formData
        });

        const data = await response.json(); // Parse response

        if (!response.ok) {
            errorElement.style.display = "block";
            errorElement.textContent = data.error || "An unknown error occurred.";
            console.error("Upload error:", data.error);
            return;
        }

        console.log("Upload successful:", data);
        window.location.reload();
    } catch (error) {
        console.error("Upload failed:", error);
        errorElement.style.display = "block";
        errorElement.textContent = "Something went wrong. Please try again.";
    }
});
