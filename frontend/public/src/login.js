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

    let data = await response.json();
    let errorElement = document.getElementById(isRegister ? "register-error" : "login-error");

    if (response.status === 400) {
        window.location.reload();
    } else {
        errorElement.innerText = data.error;
        errorElement.classList.remove("hidden");
    }
}

document.getElementById("login-form").addEventListener("submit", function (event) {
    handleFormSubmit(event, false);
});

document.getElementById("register-form").addEventListener("submit", function (event) {
    handleFormSubmit(event, true);
});