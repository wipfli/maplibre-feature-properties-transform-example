function containsOnlyScriptCharacters(str, script) {
    var pattern = `^[\\p{Script=${script}}\\p{P}\\p{S}\\p{Z}\\p{N}\\p{M}]*$`;
    var re = new RegExp(pattern, 'u');
    return re.test(str);
}

function getLatinName(properties) {
    if ('name' in properties && containsOnlyScriptCharacters(properties['name'], 'Latin')) {
        return properties['name'];
    }
    
    const tags = ['int_name', 'name:en', 'name:de'];

    for (const tag of tags) {
        if (tag in properties) {
            return properties[tag];
        }
    }
    
    for (const key in properties) {
        if (key.startsWith('name:') && containsOnlyScriptCharacters(properties[key], 'Latin')) {
            return properties[key];
        }
    }

    return '';
}

const getFirstLine = (properties) => {
    var pmapScript = properties['pmap:script'] === undefined ? "Latin" : properties['pmap:script'];

    if (`name:${language}` in properties) {
        return properties[`name:${language}`];
    }

    if (pmapScript === script) {
        return properties['name'];
    }

    if (script === 'Latin') {
        return getLatinName(properties);
    }
    else {
        for (var key in properties) {
            // loop though properties
            if (key.startsWith('name:') && containsOnlyScriptCharacters(properties[key], script)) {
                // take first name:* that has the target script
                return properties[key];
            }
        }
    }

    if (script !== 'Latin' && pmapScript !== 'Latin') {
        return getLatinName(properties);
    }

    return '';
}

const getSecondLine = (properties) => {
    var pmapScript = properties['pmap:script'] === undefined ? "Latin" : properties['pmap:script'];

    if ('name' in properties && pmapScript !== script) {
        return properties['name'];
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

    var firstLine = getFirstLine(properties);
    var secondLine = getSecondLine(properties);

    var parsedName = firstLine + ' \n' + secondLine;
    parsedName = parsedName.trim();

    if (['country', 'bay', 'sea', 'strait'].includes(properties['pmap:kind']) && firstLine !== '') {
        properties['name'] = firstLine;
    }
    else {
        properties['name'] = parsedName;
    }
};

self.setFeaturePropertiesTransform(featurePropertiesTransform);
