"use strict";

const componentDeleteAttributes = [
    {
        component: "model",
        attributes: ["lightmapped", "lightmapSizeMultiplier", "castShadowsLightMap", "lightMapped", "lightMapSizeMultiplier", "isStatic", "layers", "batchGroupId"]
    }
]

window.addEventListener("FIND_ENTITY", function (e) {
    let method = e.detail.method;
    let value = e.detail.value;

    switch (method) {
        case "tag":
            findEnitiesByTag(value);
            break;
        case "name":
            findEntitiesByName(value);
            break;
        case "regex":
            findEntitiesByRegex(value);
            break;
        default:
            console.error("Invalid find method");
            return;
    }
});

window.addEventListener("EXPORT_ENTITIES", function (e) {
    let exportType = e.detail.exportType;
    let downloadFile = e.detail.downloadFile;
    console.log(exportType, downloadFile);
    exportObjects(exportType === "hierarchy", downloadFile);
});

function findEnitiesByTag(tags) {
    let entitiesByTag = editor.entities.root.listByTag(tags.split(","));
    if (entitiesByTag.length === 0) {
        console.log(`No entities found with tag: ${tag}`);
        return;
    }
    editor.selection.clear();
    entitiesByTag.forEach((entity) => editor.selection.add(entity));
    window.dispatchEvent(
        new CustomEvent("FIND_ENTITY_RESULT", { detail: entitiesByTag.length })
    );
}

function findEntitiesByName(name) {
    let allEntities = editor.entities.list();
    let entitiesByName = allEntities.filter(
        (entity) => entity.viewportEntity.name === name
    );
    if (entitiesByName.length === 0) {
        console.log(`No entities found with name: ${name}`);
        return;
    }
    editor.selection.clear();
    entitiesByName.forEach((entity) => editor.selection.add(entity));
    window.dispatchEvent(
        new CustomEvent("FIND_ENTITY_RESULT", { detail: entitiesByName.length })
    );
}

function findEntitiesByRegex(regexString) {
    let allEntities = editor.entities.list();
    let entitiesByRegex = allEntities.filter((entity) =>
        entity.viewportEntity.name.match(regexString)
    );
    if (entitiesByRegex.length === 0) {
        console.log(`No entities found with regex: ${regexString}`);
        return;
    }
    editor.selection.clear();
    entitiesByRegex.forEach((entity) => editor.selection.add(entity));
    window.dispatchEvent(
        new CustomEvent("FIND_ENTITY_RESULT", {
            detail: entitiesByRegex.length,
        })
    );
}

function exportObjects(exportHierarchy = true, downloadFile = false) {
    let entityList = editor.selection.items;
    let jsonString;
    if (entityList.length === 0) {
        alert("No entities selected");
        return;
    } else if (entityList.length === 1) {
        jsonString = exportHierarchy
            ? entityList[0].jsonHierarchy()
            : entityList[0].json();
        cleanEntity(jsonString);
        jsonString = JSON.stringify(jsonString);
    } else {
        let jsonList = [];
        entityList.forEach((entity) => {
            let entityJson = exportHierarchy
                ? entity.jsonHierarchy()
                : entity.json();
            cleanEntity(entityJson);
            jsonList.push(entityJson);
        });
        jsonString = JSON.stringify(jsonList);
    }
    if (downloadFile) {
        let name =
            entityList.length === 1
                ? entityList[0].viewportEntity.name
                : "export";
        download(jsonString, `${name}.json`, "application/json");
    } else {
        writeToClipboard(jsonString);
        alert("Copied to clipboard");
    }
}

function download(data, filename, type) {
    let file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
        let a = document.createElement("a");
        let url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function writeToClipboard(text) {
    let textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
}

function cleanEntity(entity) {
    delete entity.parent;
    delete entity.resource_id;

    let uneabledComponents = [];
    for (let componentName in entity.components) {
        if (entity.components.hasOwnProperty(componentName)) {
            if (!entity.components[componentName].enabled) {
                uneabledComponents.push(componentName);
            }
            else {
                cleanComponent(componentName, entity.components[componentName]);
            }
        }
    }
    uneabledComponents.forEach((componentName) => {
        delete entity.components[componentName];
    });

    if (entity.components && entity.components.script) {
        let scripts = entity.components.script.scripts;
        entity.components.script = scripts;
        for (let scriptName in scripts) {
            let script = scripts[scriptName];
            let attributes = script.attributes;
            replaceAssetIdsWithNames(attributes);
            script = attributes;
            scripts[scriptName] = script;
        }
    }
    else {
      for(let component in entity.components) {
        if (entity.components.hasOwnProperty(component)) {
          let attributes = entity.components[component];
          replaceAssetIdsWithNames(attributes);
        }
      }
    }

    if(entity.template_id) {
        delete entity.template_id;
    }
    if(entity.template_ent_ids) {
        delete entity.template_ent_ids;
    }

    if (entity.children) {
        entity.children.forEach((child) => cleanEntity(child));
    }
}

function replaceAssetIdsWithNames(attributes) {
    let removeList = [];
    for (let key in attributes) {
        if (attributes.hasOwnProperty(key)) {
            if (Array.isArray(attributes[key])) {
                attributes[key] = attributes[key].map((value) => {
                    if (isAssetId(value)) {
                        let assetName = getAssetName(value);
                        if (assetName) {
                            if (
                                getAssetType(value) !== "json" &&
                                getAssetType(value) !== "material"
                            ) {
                                assetName = removeFilenameExtension(assetName);
                            } else if (getExtension(assetName) !== "json") {
                                assetName = `${assetName}.json`;
                            }
                        }

                        return assetName;
                    }
                    return value;
                });
            } else if (isAssetId(attributes[key])) {
                let assetName = getAssetName(attributes[key]);
                if (assetName) {
                    if (
                        getAssetType(attributes[key]) !== "json" &&
                        getAssetType(attributes[key]) !== "material"
                    ) {
                        assetName = removeFilenameExtension(assetName);
                    } else if (getExtension(assetName) !== "json") {
                        assetName = `${assetName}.json`;
                    }
                }

                attributes[key] = assetName;
            } else if (isEntityId(attributes[key])) {
                removeList.push(key);
            }
        }
    }
    removeList.forEach((key) => delete attributes[key]);
}

function getAssetName(assetId) {
    let asset = editor.assets.get(assetId);
    if (asset) {
        return asset.json().name;
    }
    return null;
}

function getExtension(name) {
    return name.split(".").pop();
}

function getAssetType(assetId) {
    let asset = editor.assets.get(assetId);
    if (asset) {
        return asset.json().type;
    }
    return null;
}

function removeFilenameExtension(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

function isAssetId(id) {
    return `${id}`.match(/[\d]{8,10}/)?.length === 1;
}

function isEntityId(id) {
    return (
        `${id}`.match(
            /[\d|\w]{8}-[\d|\w]{4}-4[\d|\w]{3}-[\d|\w]{4}-[\d|\w]{12}/
        )?.length === 1
    );
}

function cleanComponent(name, component) {
    componentDeleteAttributes.forEach((c) => {
        if (c.component === name) {
            c.attributes.forEach((attribute) => {
                delete component[attribute];
            });
        }
    });
}
