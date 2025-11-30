// Test file to verify Haversine formula accuracy
// Source - https://stackoverflow.com/a/27943
// Posted by talkol, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-01, License - CC BY-SA 4.0

function haversineDistanceKM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    function toRad(degree) {
        return degree * Math.PI / 180;
    }

    const lat1 = toRad(lat1Deg);
    const lon1 = toRad(lon1Deg);
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);

    const { sin, cos, sqrt, atan2 } = Math;

    const R = 6371; // earth radius in km 
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = sin(dLat / 2) * sin(dLat / 2)
        + cos(lat1) * cos(lat2)
        * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a));
    const d = R * c;
    return d; // distance in km
}

// Test with the example coordinates from StackOverflow
const d = haversineDistanceKM(12.3659908, 76.6003301, 12.3648177, 76.6018246);
console.log('Distance between example coordinates:', d.toFixed(2), 'km');

// Add your specific test coordinates here
// Example: If you expect 0.3 km between two points, test them:
// const testDistance = haversineDistanceKM(lat1, lon1, lat2, lon2);
// console.log('Your test distance:', testDistance.toFixed(2), 'km');
