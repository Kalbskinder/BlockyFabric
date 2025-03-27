document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch('/api/loggedIn');
    const data = await response.json();
    if (!data.loggedIn) {
        window.location.href = '/login';
        return;
    }
    return;
});