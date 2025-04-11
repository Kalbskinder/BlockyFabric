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

const toolboxJson = {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category',
        name: 'Logic',
        colour: '#5C81A6',
        contents: [
          { kind: 'block', type: 'controls_if' },
          { kind: 'block', type: 'logic_compare' }
        ]
      },
      {
        kind: 'category',
        name: 'Math',
        colour: '#5CA65C',
        'contents': [
          { kind: 'block', type: 'math_number' },
          { kind: 'block', type: 'math_arithmetic' }
        ]
      },
      {
        kind: 'category',
        name: 'Text',
        colour: '#5CA65C',
        contents: [
          { kind: 'block', type: 'text' },
          { kind: 'block', type: 'text_join' }
        ]
      },
    ]
  };
  

let workspace;

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const projectId = parseInt(params.get("id"));
    
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: toolboxJson,
        theme: darkTheme,
        grid: { spacing: 20, length: 3, colour: '#555', snap: false },
        trashcan: true,
        renderer: 'zelos',
        toolboxPosition: 'start',
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
            Blockly.serialization.workspaces.load(state, workspace);
        }
    } catch (error) {
        console.error('Error while loading the workspace: ', error);
        if (error === 'Projekt nicht gefunden') { return; }
        newError(error.message || error);
    }
}

document.getElementById('saveButton').addEventListener('click', saveWorkspace);

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

/* Slide in Messages */ /* Animation not working properly */
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

function scrollToCategory(labelText) {
    const flyout = workspace.getFlyout();
    const metrics = flyout.getMetrics();
    const flyoutDom = flyout.getWorkspace().getTopBlocks(false);

    for (const block of flyoutDom) {
        if (block.type === 'label' && block.getFieldValue('TEXT') === labelText) {
            const y = block.getRelativeToSurfaceXY().y;
            flyout.scrollbar.set(y);
            break;
        }
    }
}
