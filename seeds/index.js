const express=require('express');
const path = require('path');
const mongoose =require('mongoose');
const campground= require('../models/campground');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelper');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp-maptiler')
    .then(() => {
        console.log("Database connected");
    })
    .catch(err => {
        console.error("Connection error:", err);
    });
const sample = array => array[Math.floor(Math.random()*array.length)];
const seedDb = async () => {
    await campground.deleteMany({});
    for (let i=0; i<50; i++){
        const random1000=Math.floor(Math.random()*1000);
        const price=Math.floor(Math.random()*20)+10;
        const camp = new campground({
            author:'690556bed82882a3dd371d99',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            title: `${sample(descriptors)} ${sample(places)}`,
            description:'Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque tempora dolore ut et quia excepturi impedit vel reiciendis, rem est accusamus aliquam, incidunt nam, natus placeat fuga voluptas officia commodi.',
            price,
            images:  [
                        {
                            url: 'https://res.cloudinary.com/dzrfzycqc/image/upload/v1762343966/YelpCamp/epkht2ft8hn7ngoqqoz3.png',
                            filename: 'YelpCamp/epkht2ft8hn7ngoqqoz3',
                        },
                        {
                            url: 'https://res.cloudinary.com/dzrfzycqc/image/upload/v1762343968/YelpCamp/euhsc1glx86wrdvxk8l9.jpg',
                            filename: 'YelpCamp/euhsc1glx86wrdvxk8l9',
                        }
                    ]
        })
        await camp.save();
    }
}

seedDb().then(()=>{
    mongoose.connection.close()
});