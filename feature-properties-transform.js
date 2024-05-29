// Make the third letter of the value stored in the 'NAME' tag uppercase.

const featurePropertiesTransform = (source, sourceLayer, tileID, properties) => {

    if (properties === null) return;

    if ('NAME' in properties) {
        const name = properties['NAME'];
        if (name.length > 3) {
            properties['NAME'] = name.slice(0, 2) + name[2].toUpperCase() + name.slice(3);
        }
    }

};

self.setFeaturePropertiesTransform(featurePropertiesTransform);
