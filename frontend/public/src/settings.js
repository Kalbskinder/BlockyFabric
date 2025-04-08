async function changeUsername() {
    const username = document.getElementById("newUsername").value;
    const msg = document.getElementById("usernameMsg");

    try {
        const res = await fetch("/settings/username", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.error || "Something went wrong";
            msg.style.color = "red";
        } else {
            msg.textContent = "Username has been changed";
            msg.style.color = "green";
        }
    } catch (err) {
        msg.textContent = "Server error: " + err.message;
        msg.style.color = "red";
    }
}
async function changePassword() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const msg = document.getElementById("passwordMsg");

    msg.textContent = "";
    msg.style.color = "red";

    if (!currentPassword || !newPassword || !confirmPassword) {
        msg.textContent = "Please fill in all fields.";
        return;
    }

    if (newPassword !== confirmPassword) {
        msg.textContent = "The passwords don't match.";
        return;
    }

    try {
        const res = await fetch("/settings/password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.error || "Something went wrong";
        } else {
            msg.style.color = "green";
            msg.textContent = "Passwort successfully updated.";
        }
    } catch (err) {
        msg.textContent = "Servererror: " + err.message;
    }
}


function openThemeSidebar() {
    const sidebar = document.getElementById("themeSidebar");
    const themeIcon = document.getElementById("theme-icon");

    themeIcon.style.display = "none";
    sidebar.style.display = "block";
    sidebar.classList.remove("close");
    sidebar.classList.add("open");
    sidebar.style.animation = "slidein 0.5s forwards";
}

function closeThemeSidebar() {
    const sidebar = document.getElementById("themeSidebar");
    const themeIcon = document.getElementById("theme-icon");

    sidebar.classList.remove("open");
    sidebar.classList.add("close");
    sidebar.style.animation = "slideout 0.5s forwards";

    // Wenn Animation fertig ist, Sidebar wirklich ausblenden
    sidebar.addEventListener("animationend", function handler() {
        sidebar.style.display = "none";
        themeIcon.style.display = "block"; // Jetzt erst anzeigen
        sidebar.removeEventListener("animationend", handler); // Nur einmal
    });
}
