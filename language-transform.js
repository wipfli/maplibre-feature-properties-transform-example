

function containsOnlyScriptCharacters(str, script) {
    var pattern = `^[\\p{Script=${script}}\\p{P}\\p{S}\\p{Z}\\p{N}\\p{M}]*$`;
    var re = new RegExp(pattern, 'u');
    return re.test(str);
}

function deleteScriptCharacters(str, script) {
    var pattern = `[\\p{Script=${script}}]`;
    var re = new RegExp(pattern, 'gu');
    return str.replace(re, '');
}

function getLatinName(properties) {
    if ('name' in properties && containsOnlyScriptCharacters(properties['name'], 'Latin')) {
        return properties['name'];
    }
    
    const languages = ['en', 'es', 'fr', 'pt', 'de'];

    for (const language of languages) {
        const key = `name:${language}`;
        if (key in properties) {
            return properties[key];
        }
    }
    
    for (const key in properties) {
        if (key.startsWith('name:') && containsOnlyScriptCharacters(properties[key], 'Latin')) {
            return properties[key];
        }
    }

    return '';
}

// https://www.openstreetmap.org/node/305640277/ Baltic Sea, Latin en
// Morze Bałtyckie  - Baltijos jūra - Baltijas jūra -  Läänemeri - Itämeri - Östersjön - Østersøen - Ostsee - Балтийское море

// https://www.openstreetmap.org/relation/11118019 Otranto Strait, Greek el
// Ngushtica e Otrantos / Canale d'Otranto / Στενό του Οτράντο

// Avenue Nato in Athens, Latin it

const featurePropertiesTransform = (source, sourceLayer, tileID, geometryType, featureID, properties) => {
    
    if (properties === null) return;
    if (source !== 'protomaps') return;
    //if (sourceLayer != 'places') return;

    var firstLine = '';
    if (`name:${language}` in properties) {
        firstLine = properties[`name:${language}`];
    }
    else {
        if ('name' in properties && containsOnlyScriptCharacters(properties['name'], script)) {
            firstLine = properties['name'];
        }
        else {
            for (var key in properties) {
                if (key.startsWith('name:') && containsOnlyScriptCharacters(properties[key], script)) {
                    firstLine = properties[key];
                    break;
                }
            }
        }            
    }

    var secondLine = '';
    if ('name' in properties && !containsOnlyScriptCharacters(properties['name'], script)) {
        secondLine = deleteScriptCharacters(properties['name'], script);
    }

    if (firstLine === '' && script !== 'Latin' && !containsOnlyScriptCharacters(secondLine, 'Latin')) {
        // fallback to Latin
        firstLine = getLatinName(properties);
        secondLine = deleteScriptCharacters(secondLine, 'Latin');
    }

    var parsedName = firstLine + ' \n' + secondLine;
    parsedName = parsedName.trim();

    if (properties['pmap:kind'] === 'country') {
        properties['name'] = firstLine;
    }
    else {
        properties['name'] = parsedName;
    }
};

self.setFeaturePropertiesTransform(featurePropertiesTransform);
