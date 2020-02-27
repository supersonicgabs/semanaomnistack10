const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const {findConnections, sendMessage} = require('../websocket');

//index (lista), show (um único), store, update, destroy
module.exports = {
    async index(request, response){
        const devs = await Dev.find();

        return response.json(devs);
    },
    async store(request, response){
        const { github_username, techs, latitude, longitude } = request.body;
    
        let dev = await Dev.findOne({ github_username });

        if(!dev){
            const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
            //continuar 
            const {name = login, avatar_url, bio} = apiResponse.data;
        
            const techsArray = parseStringAsArray(techs)
        
            const location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
            
            dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location
            })

            // Filtrar as conexões que estão há no máximo 10km de distância
            // e que o novo dev tenha pelo menos uma das tecnologias filtradas

            const sendSocketMessageTo = findConnections(
                {latitude, longitude},
                techsArray
            )

            sendMessage(sendSocketMessageTo, 'new-dev', dev);
        }
        
        return response.json(dev);
    },
    async update(request, response) {
        Dev.findById(request.params._id, (err, dev)=>{
            if(err){
                response.send(err)
            }
            dev.github_username = request.body.github_name;
            dev.name = request.body.name;
            dev.avatar_url = request.body.avatar_url;
            dev.bio = request.body.bio;
            dev.techs = request.body.techs;
            dev.location = request.body.location.coordinates;
    
            dev.save((err)=>{
                if(err){
                    res.json(err)
                }
                response.json({
                    message: 'Dev info updated',
                    data: dev
                })
            })
        })
    }    
}