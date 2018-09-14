const Hapi = require('hapi');
const BlockChain = require('./blockChain');
const Block = require('./block');

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});
// Create the blockchain object
const blockChain = new BlockChain();

/* ===== Route /block/{blockHeight} =========================
|  Search the block {blockHeight} in the chain              |
|  Parameters:                                              |
|     blockHeight: Block height to search in the chain      |
|  =========================================================*/
server.route({
    method:'GET',
    path:'/block/{blockHeight}',
    handler:async function(request,h) {
        const blockHeight = encodeURIComponent(request.params.blockHeight);
        let response;
        await blockChain.getBlock(blockHeight)
        .then((value) => {
            response = h.response(JSON.parse(value));
            response.code(200);
        }).catch((err) => {
            console.log('Block# ' + blockHeight + ' not found. Error: ' + err);
            response = h.response({"Error": "Block# " + blockHeight + " not found"});
            response.code(404);
        });
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

/* ===== Route /block/{blockHeight} =========================
|  Search the block {blockHeight} in the chain              |
|  Parameters:                                              |
|     blockHeight: Block height to search in the chain      |
|  =========================================================*/
server.route({
    method:'POST',
    path:'/block',
    handler:async function(request,h) {
        const payload = request.payload;
        console.log(payload);
        let response;
        // Check if payload is not empty or the key is not body
        if(!payload.hasOwnProperty("body")) {
            response = h.response({"Error": "No content on payload"});
            response.code(404);
        } else {
            // Check if the content in the bdoy is not empty
            if(!payload.body) {
                response = h.response({"Error": "No content on body payload"});
                response.code(404);
            } else {
                // Add the new block to the chain
                const blockAdded = await blockChain.addBlock(new Block(payload.body));
                // Check if Block was successfully added
                if(blockAdded) {
                    response = h.response(blockAdded);
                    response.code(200);
                } else {
                    response = h.response({"Error": "Block was not successfully added to the Chain"});
                    response.code(404);
                }
            }
        }
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});
// Start the server
async function start() {
    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
};

// Start the service
start();