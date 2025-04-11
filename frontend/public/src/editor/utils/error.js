const errorSlideInElement = document.getElementById("error-slidein");
const errorSlideInText = document.getElementById("error-slidein-text");

export function newError(msg) {
    errorSlideInText.textContent = msg;
            
    errorSlideInElement.style.visibility = "hidden";
    errorSlideInElement.style.opacity = "0"; 
    errorSlideInElement.style.animation = "none"; 
    
    setTimeout(() => {
        errorSlideInElement.style.animation = "slidein 3s ease-in-out";
        errorSlideInElement.style.visibility = "visible";
        errorSlideInElement.style.opacity = "1";
    }, 50);
            
    setTimeout(() => {
        errorSlideInElement.style.visibility = "hidden";
        errorSlideInElement.style.opacity = "0";
    }, 3500);
    return;
}