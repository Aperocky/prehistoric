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
    siminfobox.appendChild(addInfoField("By default, people are shown, click SHOW to toggle", "#999"));
    siminfobox.appendChild(addInfoField("=============================", "#888"));
    siminfobox.appendChild(addInfoField("# Special thanks to Anuken for sprites", "#999"));
}

export function splitLine(siminfobox) {
    siminfobox.appendChild(addInfoField("=============================", "#999"));
}

export function objectToLines(siminfobox, target) {
    for (let [key, value] of Object.entries(target)) {
        siminfobox.appendChild(addInfoField(`${key}: ${value}`));
    }
}
