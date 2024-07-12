document.getElementById('statusMessage').textContent = "loading";
// override prompt command
window.prompt = function(promptText, defaultValue) {
    return ipc.sendSync("prompt", promptText, defaultValue);
};

const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require("electron");
const { loadperipheral } = require("./blocksmanager");
const Blockly = require('blockly');
const ipc = ipcRenderer;


let isprojectsaved = false;
let usedlibinproject = []

Blockly.utils.colour.setHsvSaturation(0.9)

let originaltoolbar = fs.readFileSync(path.join(__dirname, "toolbox.xml"), 'utf8');
    
var workspace = Blockly.inject('blocklyDiv', {
    toolbox: originaltoolbar,
    trashcan: true,
    grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
    }
});

originaltoolbar = loadperipheral(workspace, originaltoolbar, "test");

workspace.getToolbox().getFlyout().autoClose = false;

// Save workspace
ipc.on('save-workspace-request', (event) => {
    const state = Blockly.serialization.workspaces.save(workspace);
    const data = {
        "usedlibrary": usedlibinproject,
        "content": state
    }
    ipc.send('save-workspace', data);
});

// Load workspace
ipc.on('load-workspace', (event, json) => {
    if (json) {
        data = JSON.parse(json)
        usedlibinproject = data.usedlibrary
        workspace.clear()
        Blockly.serialization.workspaces.load(data.content, workspace);
        isprojectsaved = true
    } 
})

workspace.addChangeListener(function(event) {
    if ([Blockly.Events.UI, 
        Blockly.Events.VIEWPORT_CHANGE, 
        Blockly.Events.TOOLBOX_ITEM_SELECT]
        .includes(event.type)) {
      return; // Don't care about UI events.
    }
    if (isprojectsaved) {
        isprojectsaved = false
        ipc.send("workspace-notsave")
    };
});

ipc.on('workspace-saved', (event, success) => {
    isprojectsaved = success
});

// Ensure Blockly container is shown after the workspace is injected
document.getElementById('loadingScreen').style.visibility = 'hidden';
document.getElementById('blocklyContainer').style.visibility = 'visible';
document.getElementById('statusMessage').textContent = "ready";