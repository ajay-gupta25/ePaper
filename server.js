const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors()); // Enable CORS for all origins
// https://epaper.gujaratsamachar.com/kheda-anand/24-12-2024/1
const basePath = 'https://epaper.gujaratsamachar.com/';

// Endpoint to fetch images
app.get('/fetch-images', async (req, res) => {
    // console.log('req:', req);
    try {
        // const url = 'https://epaper.gujaratsamachar.com/ahmedabad/23-12-2024/3';

        console.log('req.query.:', req.query);
        const { date, number, title } = req.query;
        if (!date || !number) {
            return res.status(400).send('Date and number are required');
        }

        const url = `https://epaper.gujaratsamachar.com/${title}/${date}/${number}`; // Construct URL dynamically


        let images = await fetchData(url);
        // console.log('req.body:', req);

 

        res.json(images);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching images');
    }
});

async function fetchData(url) {
    console.log('ajay is testing---', url);
           // Fetch the webpage content
           const { data } = await axios.get(url);

        //    console.log('data: ', data);
   
           // Load the HTML into cheerio
           const $ = cheerio.load(data);
   
           // Select images with the specific classes
           const images = [];
           $('img.w-100.sky.epaper_page').each((index, element) => {
               const imgSrc = $(element).attr('src');
               if (imgSrc) {
                   images.push(imgSrc.startsWith('http') ? imgSrc : `https:${imgSrc}`);
               }
           });
           return images;
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
