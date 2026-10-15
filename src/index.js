import {MiniMaple} from "./miniMaple";

document.addEventListener('DOMContentLoaded', setup)

const maple = new MiniMaple();

function setup() {
    document.getElementById('diffButton').onclick = runDiff;
    runDiff();
}

function runDiff() {
    const expr = document.getElementById('exprInput').value;
    const sym = document.getElementById('symInput').value;
    const result = document.getElementById('result');
    try {
        result.textContent = maple.diff(expr, sym);
    } catch (error) {
        result.textContent = `Error: ${error.message}`;
    }
}
