document.getElementById("show-register").addEventListener("click", function () {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.remove("hidden");
});

document.getElementById("show-login").addEventListener("click", function () {
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
});

async function handleFormSubmit(event, isRegister) {
    event.preventDefault();

    // Daten für Login oder Registrierung abrufen
    let email = document.getElementById(isRegister ? "register-email" : "login-email").value;
    let password = document.getElementById(isRegister ? "register-password" : "login-password").value;

    let requestBody = { email, password };

    if (isRegister) {
        let username = document.getElementById("register-username").value;
        let confirmPassword = document.getElementById("register-confirm-password").value;
        let passwordError = document.getElementById("password-error");
        let confirmPasswordError = document.getElementById("confirm-password-error");

        let valid = true;

        if (password.length < 8) {
            passwordError.style.display = "block";
            valid = false;
        } else {
            passwordError.style.display = "none";
        }

        if (password !== confirmPassword) {
            confirmPasswordError.style.display = "block";
            valid = false;
        } else {
            confirmPasswordError.style.display = "none";
        }

        if (!valid) return;

        requestBody.username = username;
        requestBody.confirmPassword = confirmPassword;
    }

    let response = await fetch(isRegister ? "/auth/register" : "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    let errorElement = document.getElementById(isRegister ? "register-error" : "login-error");

    if (!isRegister && response.status === 401) {
        errorElement.style.display = "block";
        errorElement.style.marginBottom = "12px";
        errorElement.textContent = "Invalid credentials";
    }

    if (isRegister && response.status === 401) {
        let emailError = document.getElementById("email-error");
        emailError.style.display = "block";
    }

    if (response.status === 200) {
        window.location.href = "/"
    }
}

document.getElementById("login-form").addEventListener("submit", function (event) {
    handleFormSubmit(event, false);
});

document.getElementById("register-form").addEventListener("submit", function (event) {
    handleFormSubmit(event, true);
});