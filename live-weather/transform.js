async function featurePropertiesTransform(source, sourceLayer, tileID, geometryType, featureID, properties) {

    if (properties === null) return;

    if (sourceLayer === 'centroids' && geometryType === 'Point') {

        const response = await fetch(`https://wipfli.github.io/maplibre-feature-properties-transform-example/live-weather/countries/${properties['NAME']}`);
        
        var name = properties['NAME'];
        if (response.status === 200) {
            const temperature = await response.text();
            name += `\n${Math.round(temperature)} °C`
        }
        properties['NAME'] = name
    }

};

self.setFeaturePropertiesTransform(featurePropertiesTransform);
