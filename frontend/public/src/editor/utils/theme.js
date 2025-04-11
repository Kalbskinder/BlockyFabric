export const darkTheme = Blockly.Theme.defineTheme('darkTheme', {
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

export const lightTheme = Blockly.Theme.defineTheme('lightTheme', {
    base: Blockly.Themes.Classic,
    componentStyles: {
        workspaceBackgroundColour: '#ffffff',
        toolboxBackgroundColour: '#f0f0f0',
        toolboxForegroundColour: '#333333',
        flyoutBackgroundColour: '#f9f9f9',
        flyoutForegroundColour: '#444444',
        scrollbarColour: '#aaa',
        insertionMarkerColour: '#000',
        insertionMarkerOpacity: 0.2,
    },
    categoryStyles: {
        logic_category: {
            colour: '#4caf50',
        },
    },
    blockStyles: {
        logic_blocks: {
            colourPrimary: '#4caf50',
        }
    }
});