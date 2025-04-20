// Theme

// TODO: Move themes to an external file
const darkTheme = Blockly.Theme.defineTheme('darkTheme', {
    base: Blockly.Themes.Classic,
    componentStyles: {
        workspaceBackgroundColour: '#1e1e1e',
        toolboxBackgroundColour: '#252526',
        toolboxForegroundColour: '#fff',
        flyoutBackgroundColour: '#2d2d2d',
        flyoutForegroundColour: '#ccc',
        insertionMarkerColour: '#fff',
        scrollbarColour: '#797979',
        insertionMarkerOpacity: 0.3,
    },
    blockStyles: {
        logic_blocks: {
            colourPrimary: '#ff6f61',
        },
        loop_blocks: {
            colourPrimary: '#ffa500',
        }
    },
    categoryStyles: {
        logic_category: {
            colour: '#ff6f61'
        },
        loop_category: {
            colour: '#ffa500'
        }
    }
});


/* =============================
   Blockly Setup
   ============================= */

let workspace;

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const projectId = parseInt(params.get("id"));

    const toolbox = await loadBlockly(); // Load toolbox and blocks from json file
    
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: toolbox,
        theme: darkTheme,
        grid: { spacing: 20, length: 3, colour: '#555', snap: false },
        trashcan: false,
        renderer: 'zelos',
        toolboxPosition: 'start',
        scrollbars: true,
        zoom: {
          controls: true,
          wheel: true,
          startScale: 0.8,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2
        }
    });

    await fetchWorkspace(projectId);
});

// Load the workspace state
async function fetchWorkspace(projectId) {
    try {
        const response = await fetch(`/editor/load-workspace/${projectId}`);
        const result = await response.json();

        if (!response.ok) {
            window.location.href = '/dashboard'
            throw new Error(result.error || 'Error while loading the workspace');
        }

        if (result.workspaceState) {
            const state = result.workspaceState;
            console.log(state)
            Blockly.serialization.workspaces.load(state, workspace);
        }
    } catch (error) {
        console.error('Error while loading the workspace: ', error);
        if (error === 'Project was not found') { return; }
        newError(error.message || error);
    }
}

document.getElementById('saveButton').addEventListener('click', saveWorkspace);

// Save the workspace state in the database
async function saveWorkspace() {
    const state = Blockly.serialization.workspaces.save(workspace);
    const params = new URLSearchParams(window.location.search);
    const projectId = parseInt(params.get("id"));

    try {
        const response = await fetch('/editor/save-workspace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, workspaceState: state })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Error while trying to save workspace");
        }

        newSuccess(result.message);
    } catch (error) {
        console.error('Error while trying to save workspace:', error);
        newError(error.message || error);
    }
}

// Load toolbox and blocks from json file
async function loadBlockly() {
    try {
        const blocksResponse = await fetch('/src/editor/data/blocks/blocks_config.json');
        const blocks = await blocksResponse.json();
        Blockly.defineBlocksWithJsonArray(blocks);

        const tooboxResponse = await fetch('/src/editor/data/toolbox/toolbox_config.json');
        const toolbox = await tooboxResponse.json();
        return toolbox;
    } catch (error) {
        console.error("Error while loading blocks and toolbox:", error);
    }
}



/* =============================================
   Notifications for Error and Success Messages
   ============================================= */

const errorSlideInElement = document.getElementById("error-slidein");
const errorSlideInText = document.getElementById("error-slidein-text");

function newError(msg) {
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

const successSlideInElement = document.getElementById("success-slidein");
const successSlideInText = document.getElementById("success-slidein-text");

function newSuccess(msg) {
    successSlideInText.textContent = msg;
            
    successSlideInElement.style.visibility = "hidden";
    successSlideInElement.style.opacity = "0"; 
    successSlideInElement.style.animation = "none"; 
    
    setTimeout(() => {
        successSlideInElement.style.animation = "slidein 3s ease-in-out";
        successSlideInElement.style.visibility = "visible";
        successSlideInElement.style.opacity = "1";
    }, 50);
            
    setTimeout(() => {
        successSlideInElement.style.visibility = "hidden";
        successSlideInElement.style.opacity = "0";
    }, 3500);
}


/* Editor Modals */
function updateCodeDisplay() {
    const translatedCode = exportCode();
    console.log(translatedCode);
    const codeDisplay = document.getElementById("exportedCodeDisplay");
    codeDisplay.textContent = translatedCode;

    // Re-highlight with Prism
    Prism.highlightElement(codeDisplay);
}
