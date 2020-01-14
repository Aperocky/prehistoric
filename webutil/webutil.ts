export function clearDiv(div) {
    // Remove every zig
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

export function addInfoField(text, color="") {
    let pfie = document.createElement("p");
    pfie.className = "infofield"
    let cleantext = text.replace(/(\.\d{2})\d*/, "$1");
    if (color) {
        pfie.style.color = color;
    }
    pfie.textContent = cleantext;
    return pfie;
}

export function startingHelp(siminfobox) {
    clearDiv(siminfobox);
    siminfobox.appendChild(addInfoField("# Get started: ", "#999"));
    siminfobox.appendChild(addInfoField("# Change the map by RE-GENERATE", "#999"));
    siminfobox.appendChild(addInfoField("# It's hard to live in a desert, so get some green maps", "#999"));
    siminfobox.appendChild(addInfoField("# Run-Turn to start simulation", "#999"));
    siminfobox.appendChild(addInfoField("", "#999"));
    siminfobox.appendChild(addInfoField("# Currently only gatherer are supported", "#999"));
    siminfobox.appendChild(addInfoField("# More are coming fast! ", "#999"));
    siminfobox.appendChild(addInfoField("# Special thanks to Anuken for sprites", "#999"));
}
