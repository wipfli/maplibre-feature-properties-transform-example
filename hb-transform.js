importScripts('https://harfbuzz.github.io/harfbuzzjs/hbjs.js');

var hb = null;
var font = null;
var encoding = {};

async function prepare() {

    const wasm = await fetch("https://harfbuzz.github.io/harfbuzzjs/hb.wasm");
    const wasmInstance = await WebAssembly.instantiate(await wasm.arrayBuffer());
    hb = hbjs(wasmInstance.instance);
    const rawFont = await fetch('http://localhost:3000/NotoSansDevanagari-Regular.ttf');
    // const rawFont = await fetch('http://localhost:3000/Frutiger-Neue-Regular.ttf');
    var fontBlob = new Uint8Array(await rawFont.arrayBuffer());

    var blob = hb.createBlob(fontBlob);
    var face = hb.createFace(blob, 0);
    font = hb.createFont(face);

    font.setScale(1000, 1000);

    const encodingRaw = await fetch('http://localhost:3000/encoding.csv');
    const encodingCSV = await encodingRaw.text();
    const encodingLines = encodingCSV.split('\n');
    
    for (var line of encodingLines.slice(1)) {
        const [index, x_offset, y_offset, x_advance, y_advance, codepoint] = line.split(',');
        encoding[`${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`] = +codepoint;
    }

    self.setFeaturePropertiesTransform(featurePropertiesTransform);
}

prepare();

function getCodepoint(positionedGlyph) {
    const index = positionedGlyph['g'];
    const x_offset  = Math.round(positionedGlyph['dx'] / 64);
    const y_offset  = Math.round(positionedGlyph['dy'] / 64);
    const x_advance = Math.round(positionedGlyph['ax'] / 64);
    const y_advance = Math.round(positionedGlyph['ay'] / 64);

    var key = '';

    key = `${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`;
    if (encoding[key] !== undefined) {
        return encoding[key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance + 1}/${y_advance}`;
    if (encoding[key] !== undefined) {
        return encoding[key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance - 1}/${y_advance}`;
    if (encoding[key] !== undefined) {
        return encoding[key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`;
    console.log(key, 'not found');

    return 65; // Capital A - means no codepoint found
}

function shape(text) {

    var buffer = hb.createBuffer();

    buffer.addText(text);

    buffer.guessSegmentProperties();

    hb.shape(font, buffer); 

    return buffer.json(font);
}

function encode(text) {
    var result = ''

    var glyphVector = shape(text);
    for (var positionedGlyph of glyphVector) {
        result += String.fromCharCode(getCodepoint(positionedGlyph));
    }

    return result;
}

const featurePropertiesTransform = (source, sourceLayer, tileID, geometryType, featureID, properties) => {
    if ('name:hi' in properties) {
        properties['name:hi'] = encode(properties['name:hi'])
    }
};

