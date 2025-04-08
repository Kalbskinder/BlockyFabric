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


function showTab(tabId) {
    document.querySelectorAll(".settings-tab").forEach(el => el.style.display = "none");
    document.querySelectorAll(".settings-sidebar li").forEach(li => li.classList.remove("active"));

    document.getElementById(`content-${tabId}`).style.display = "block";
    document.getElementById(`tab-${tabId}`).classList.add("active");
}
