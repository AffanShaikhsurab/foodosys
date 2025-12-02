const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const querystring = require('querystring');

// Helper function to make HTTP POST request
function makePostRequest(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const postData = querystring.stringify(data);
        
        const defaultHeaders = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            ...headers
        };
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: defaultHeaders
        };
        
        const req = client.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function main() {
    try {
        console.log('Starting OCR process with API v2...');
        
        // Image path
        const imagePath = 'C:\\Users\\affan\\Downloads\\Menu_of_Fatto_a_Mano_Pizzeria,_North_Laine_(desserts).jpg';
        console.log('Processing image:', imagePath);
        
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }
        
        // Read image file and convert to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        
        // Determine image type from file extension
        const ext = path.extname(imagePath).toLowerCase().substring(1);
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                         ext === 'png' ? 'image/png' : 
                         ext === 'gif' ? 'image/gif' : 
                         ext === 'bmp' ? 'image/bmp' : 
                         ext === 'tif' || ext === 'tiff' ? 'image/tiff' : 'image/jpeg';
        
        // Prepare data for API v2
        const apiData = {
            apikey: 'helloworld', // Free API key for testing
            base64Image: `data:${mimeType};base64,${imageBase64}`,
            language: 'eng',
            isOverlayRequired: false,
            detectOrientation: true,
            scale: true,
            OCREngine: 2 // Use Engine 2 for better text recognition
        };
        
        // Make API request
        console.log('Sending request to OCR.space API v2...');
        const result = await makePostRequest('https://api.ocr.space/parse/image', apiData);
        
        // Save result to file
        fs.writeFileSync('ocr-result-v2.json', JSON.stringify(result, null, 2));
        console.log('OCR Result saved to ocr-result-v2.json');
        
        // Display just the parsed text
        if (result.ParsedResults && result.ParsedResults[0]) {
            console.log('\n--- PARSED TEXT ---');
            console.log(result.ParsedResults[0].ParsedText);
            
            // Display processing info
            console.log('\n--- PROCESSING INFO ---');
            console.log(`Exit Code: ${result.OCRExitCode}`);
            console.log(`Processing Time: ${result.ProcessingTimeInMilliseconds}ms`);
            console.log(`Error on Processing: ${result.IsErroredOnProcessing}`);
            
            if (result.ErrorMessage) {
                console.log(`Error Message: ${result.ErrorMessage}`);
            }
        } else {
            console.log('No parsed results found');
        }
    } catch (e) {
        console.error('Error occurred:', e.message);
    }
}

main();