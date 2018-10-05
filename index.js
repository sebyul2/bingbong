// index.js
const express = require('express')
const app = express()
const socketio = require("socket.io")
const bluebird = require('bluebird')
const redis = require('redis')
const path = require('path')

global.Promise = bluebird
Promise.promisifyAll(redis.RedisClient.prototype)
const client = redis.createClient();


const accountSid = process.env.AUTH_TOKEN || 'ACa3b5cd876a0a1c2c4ae769091aaed328'
const authToken = process.env.ACCOUNT_SID || 'ff22e04275d26706e2696a73bdade098'

const twilio = require('twilio')(accountSid, authToken);

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')))
app.set('port', process.env.PORT || 3000)


const ioServer = require('http').createServer(app)
const io = socketio(ioServer)

const webServer = app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + webServer.address().port)
})

// socket io
io.on('connection', (socket) => {
    // login
    socket.on('login', async (uid) => {
        await client.saddAsync('active-users', uid);
        const activeUsers = await client.smembersAsync('active-users')
    })
    
    // 매칭 부분
    socket.on('join', function (room) {
        console.log('join', room)
        var clients = io.sockets.adapter.rooms[room];
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
        if (numClients == 0) {
            console.log('numClients == 0')
            socket.join(room);
        } else if (numClients == 1) {
            console.log('numClients == 1')
            socket.join(room);
            socket.emit('ready', room);
            socket.broadcast.emit('ready', room);
        } else {
            console.log('full')
            socket.emit('full', room);
        }
    });
    // twilio 토큰 획득
    socket.on('token', function () {
        console.log('socket.on token')
        twilio.tokens.create(function (err, response) {
            if (err) {
                console.log(err);
            } else {
                // socket.broadcast.emit('token', response);
                socket.emit('token', response);
            }
        });
    });
    // candidate broadcating
    socket.on('candidate', function (candidate) {
        console.log('socket.on candidate', candidate)
        socket.broadcast.emit('candidate', candidate);
    });
    // offer 전달
    socket.on('offer', function (offer) {
        console.log('socket.on offer')
        socket.broadcast.emit('offer', offer);
    });
    socket.on('answer', function (answer) {
        console.log('socket.on answer', answer)
        socket.broadcast.emit('answer', answer);
    });
});