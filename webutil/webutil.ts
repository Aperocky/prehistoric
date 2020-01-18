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
    siminfobox.appendChild(addInfoField("Get started: ", "#999"));
    siminfobox.appendChild(addInfoField("Change the map by RE-GENERATE", "#999"));
    siminfobox.appendChild(addInfoField("RUN-TURN to start simulation", "#999"));
    siminfobox.appendChild(addInfoField("=============================", "#888"));
    siminfobox.appendChild(addInfoField("Everyone starts as gatherer, but they can change with circumstances", "#999"));
    siminfobox.appendChild(addInfoField("Each tile display a max of 15 people, more info can be found by clicking on land itself", "#999"));
    siminfobox.appendChild(addInfoField("Buildings are coming soon", "#999"));
    siminfobox.appendChild(addInfoField("=============================", "#888"));
    siminfobox.appendChild(addInfoField("# Special thanks to Anuken for sprites", "#999"));
}
