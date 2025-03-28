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

    let email = document.getElementById(isRegister ? "register-email" : "login-email").value;
    let password = document.getElementById(isRegister ? "register-password" : "login-password").value;

    let requestBody = { email, password };

    if (isRegister) {
        let username = document.getElementById("register-username").value;
        let confirmPassword = document.getElementById("register-confirm-password").value;

        requestBody.username = username;
        requestBody.confirmPassword = confirmPassword;
    }

    let response = await fetch(isRegister ? "/auth/register" : "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    let responseData = await response.json();

    ["username", "email", "password", "confirmPassword"].forEach(field => {
        let errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
            errorElement.style.display = "none";
            errorElement.innerHTML = "";
        }
    });

    if (!response.ok) {
        if (responseData.errors) {
            responseData.errors.forEach(error => {
                let errorElement = document.getElementById(`${error.field}-error`);
                if (errorElement) {
                    errorElement.style.display = "block";
                    errorElement.innerHTML = error.error;
                }
            });
        } else {
            let generalError = document.getElementById(isRegister ? "register-error" : "login-error");
            generalError.style.display = "block";
            generalError.innerHTML = responseData.error || "An error occurred.";
        }
        return;
    }

    // Redirect after successful login or registration
    window.location.href = isRegister ? "/login" : "/";
}

document.getElementById("login-form").addEventListener("submit", function (event) {
    handleFormSubmit(event, false);
});

document.getElementById("register-form").addEventListener("submit", function (event) {
    handleFormSubmit(event, true);
});
