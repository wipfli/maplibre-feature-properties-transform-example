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

    const names = getNames(properties);

    if (`name:${language}` in properties) {
        return properties[`name:${language}`];
    }

    for (const name of names) {
        if (getStringScript(name) === script) {
            return name;
        }
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

const getSecondLine = (properties, scriptFirstLine) => {
    var result = ''
    const names = getNames(properties);
    for (const name of names) {
        var scriptName = getStringScript(name);
        if (scriptName !== scriptFirstLine && scriptName !== 'Unknown') {
            result += name;
            result += ' \n '
        }
    }

    result = result.trim();

    return result;
}

function getScriptRange(char) {
    const code = char.codePointAt(0);

    // Unicode script ranges (not exhaustive, add more as needed)
    if (code >= 0x0000 && code <= 0x007F) return "Latin"; // Basic Latin
    if (code >= 0x0080 && code <= 0x00FF) return "Latin"; // Latin-1 Supplement
    if (code >= 0x0100 && code <= 0x017F) return "Latin"; // Latin Extended-A
    if (code >= 0x0180 && code <= 0x024F) return "Latin"; // Latin Extended-B
    if (code >= 0x0250 && code <= 0x02AF) return "Latin"; // IPA Extensions
    if (code >= 0x0370 && code <= 0x03FF) return "Greek"; // Greek and Coptic
    if (code >= 0x0400 && code <= 0x04FF) return "Cyrillic"; // Cyrillic
    if (code >= 0x0600 && code <= 0x06FF) return "Arabic"; // Arabic
    if (code >= 0x3040 && code <= 0x309F) return "Hiragana"; // Hiragana
    if (code >= 0x30A0 && code <= 0x30FF) return "Katakana"; // Katakana
    if (code >= 0x4E00 && code <= 0x9FFF) return "Han"; // CJK Unified Ideographs
    if (code >= 0xAC00 && code <= 0xD7AF) return "Hangul"; // Hangul Syllables
    // Add more ranges as needed

    // Default to 'Unknown' for unhandled characters
    return "Unknown";
}

function getStringScript(str) {
    const scriptCounts = {};

    for (const char of str) {
        const script = getScriptRange(char);
        if (script in scriptCounts) {
            scriptCounts[script]++;
        } else {
            scriptCounts[script] = 1;
        }
    }

    let predominantScript = "Unknown";
    let maxCount = 0;

    for (const [script, count] of Object.entries(scriptCounts)) {
        if (count > maxCount) {
            maxCount = count;
            predominantScript = script;
        }
    }

    return predominantScript;
}

function segmentStringByScript(str) {
    let segments = [];
    let currentScript = null;
    let currentSegment = '';

    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        let script = getScriptRange(char);

        if (script !== currentScript) {
            // Push current segment to segments array
            currentSegment = currentSegment.trim()
            if (currentSegment !== '') {
                segments.push(currentSegment);
            }
            // Start new segment for the new script
            currentScript = script;
            currentSegment = char;
        } else {
            // Append character to current segment
            currentSegment += char;
        }
    }

    // Push the last segment to segments array
    currentSegment = currentSegment.trim();
    if (currentSegment !== '') {
        segments.push(currentSegment);
    }

    return segments;
}

function joinSegmentsByScript(segments) {
    let joinedSegments = [];
    let currentScript = null;
    let currentJoinedSegment = '';

    for (let segment of segments) {
        let script = getScriptRange(segment[0]); // Get script of the first character

        if (script === currentScript) {
            // Join with whitespace if same script
            currentJoinedSegment += ' ' + segment;
        } else {
            // Push current joined segment to joinedSegments array
            if (currentJoinedSegment !== '') {
                joinedSegments.push(currentJoinedSegment.trim());
            }
            // Start new joined segment for the new script
            currentScript = script;
            currentJoinedSegment = segment;
        }
    }

    // Push the last joined segment to joinedSegments array
    if (currentJoinedSegment !== '') {
        joinedSegments.push(currentJoinedSegment.trim());
    }

    return joinedSegments;
}

const getNames = (properties) => {
    if (!('name' in properties)) {
        return []
    }
    const segments = segmentStringByScript(properties['name']);
    return joinSegmentsByScript(segments)
}

// https://www.openstreetmap.org/node/305640277/ Baltic Sea, Latin en
// Morze Bałtyckie  - Baltijos jūra - Baltijas jūra -  Läänemeri - Itämeri - Östersjön - Østersøen - Ostsee - Балтийское море

// https://www.openstreetmap.org/relation/11118019 Otranto Strait, Greek el
// Ngushtica e Otrantos / Canale d'Otranto / Στενό του Οτράντο

// Avenue Nato in Athens, Latin it

const featurePropertiesTransform = (source, sourceLayer, tileID, geometryType, featureID, properties) => {
    
    if (properties === null) return;
    if (!('name' in properties)) return;
    if (source !== 'protomaps') return;

    var firstLine = getFirstLine(properties);
    var secondLine = getSecondLine(properties, getStringScript(firstLine));

    var parsedName = firstLine + ' \n ' + secondLine;
    parsedName = parsedName.trim();

    if (['country', 'bay', 'sea', 'strait'].includes(properties['pmap:kind']) && firstLine !== '') {
        properties['name'] = firstLine;
    }
    else {
        properties['name'] = parsedName;
    }
};

self.setFeaturePropertiesTransform(featurePropertiesTransform);
