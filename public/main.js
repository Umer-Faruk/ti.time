// watchify gives nodeJs live features. npm run watch
let Peer = require('simple-peer');
let socket = io()   // Directly connect to Host
const video = document.querySelector('video');
let client = {}

//get stream
navigator.mediaDevices.getUserMedia({video:true,audio:true})
.then(stream => {
    // notify backend that user  has granted the permission, add one more client.
    socket.emit("NewClient");   //handled in server.js
    video.srcObject = stream;
    video.play();    // user can see himself

    //used to initialize a peer
    function InitPeer(type){
        let peer = new Peer({initiator:(type=="init")? true : false, stream:stream, trickle:false})
        peer.on('stream', function(stream){ //while starting to stream/ streaming 
            CreateVideo(stream);
        });
        peer.on('close',function(){         // when stream is closed
            document.getElementById("peerVideo").remove();
            peer.destroy();
        })

        return peer;
    }

  

    //for peer of type "init"
    function MakePeer(){
        client.gotAnswer = false; //since offer is sent, until we get the offer accepted, we initialize to false
        let peer = InitPeer('init'); //type->init hence it wil; automatically send the offer
        peer.on('signal',function(data){
            if (!client.gotAnswer){
                socket.emit('Offer',data);
            }
        });

        client.peer = peer;
    }
    // for peer of type "not init"
    function FrontAnswer(){
        let peer = InitPeer("notInit");
        peer.on('signal', (data)=>{
            socket.emit('Answer',data);
        });

        peer.signal(offer);
    }


    function SignalAnswer(answer){  //handles the answer from the backend
            client.gotAnswer = true;
            let peer = client.peer;
            peer.signal(answer);

    }

    function CreateVideo(Stream){
        let video = document.createElement('video');
        video.id = 'peerVideo';
        video.srcObject = stream;
        video.class = 'embed-responsive-item';
        document.querySelector("#peerDiv").appendChild(video);
        video.play()
    }


    function SessionActive(){
        document.write('Session active, please Come back later !!!');
    }

    //----- functions are ready ---------
    //now calling the events.

    socket.on('BackOffer',FrontAnswer);     //when offer coming from back, generate answer from front
    socket.on('BackAnswer',SignalAnswer);   //if answer is coming from back-end handle it, connect both client
    socket.on('SessionActive',SessionActive); // session active
    socket.on('CreatePeer',MakePeer);       // call our make peer function
    

})
.catch(err => document.write(err));