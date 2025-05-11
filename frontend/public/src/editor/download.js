function downloadJavaFile(filename, code) {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

document.getElementById("downloadSourceBtn").addEventListener("click", () => {
    const generatedCode = exportCode();

    downloadJavaFile("Main.java", generatedCode.mainClass);
    downloadJavaFile("ModWizardAPI.java", generatedCode.helperClass);
});


document.getElementById("downloadModBtn").addEventListener("click", async () => {
    const zip = new JSZip();
    const generatedCode = exportCode();

    // Lade alle Dateien aus dem Template (kannst du auch vorher serverseitig machen)
    const response = await fetch("/templates/1.21.5/mod-template-1.21.5.zip");
    const templateBlob = await response.blob();
    const templateZip = await JSZip.loadAsync(templateBlob);

    // Ersetze Client.java
    templateZip.file("src/client/java/net/modwizard/Client.java", generatedCode.mainClass);

    // Füge ModWizardAPI.java hinzu
    templateZip.file("src/client/java/net/modwizard/ModWizardAPI.java", generatedCode.helperClass);

    // ZIP erstellen & herunterladen
    const content = await templateZip.generateAsync({ type: "blob" });
    saveAs(content, "modwizard-mod.zip");
});