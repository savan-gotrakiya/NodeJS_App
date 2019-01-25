
 const express=require('express');
 const app=express();
const bodyParser=require('body-parser');
const graphqlHttp=require('express-graphql');
const { buildSchema }= require('graphql');
 const mongoose=require('mongoose');
const Event=require('./models/event');
const User=require('./models/user');
const bcrypt=require('bcryptjs');

app.use(bodyParser.json());

app.use('/graphql',
    graphqlHttp({
        schema:buildSchema(`
            type Event {
                _id:ID!
                title:String!
                description:String!
                price:Int!
                date:String!
            }
            type User {
                _id:ID
                email:String!
                password:String
            }
            input EventInput {
                title:String!
                description:String!
                price:Int!
                date:String!
            }

            input UserInput {
                email:String!
                password:String!
            }

            type RootQuery {
                events:[Event!]
            }

            type RootMutation {
                createEvent(eventInput:EventInput):Event
                createUser(userInput:UserInput):User
            }

            schema {
                query:RootQuery
                mutation:RootMutation
            }

        `) ,
        rootValue:{
            events:()=>{
                return Event.find()
                    .then(events=>{
                        return events.map(event =>{
                            return { ...event._doc,_id:event.id}
                        });
                    })
                    .catch(err=>{
                        throw err;
                        
                    })
            },
            createEvent: function(args) {
                const event=new Event({
                    title:args.eventInput.title,
                    description:args.eventInput.description,
                    price:args.eventInput.price,
                    date:new Date(args.eventInput.date),
                    creator:'5c42327cfccb08034f209f9c'
                    
                })
                let createdEvent;
                return event
                .save()
                .then(result => { 
                    console.log(result);
                    createdEvent={ ...result._doc ,_id:result._doc._id.toString() };
                    return User.findById('5c42327cfccb08034f209f9c')
                })
                .then(user=> {
                    if(!user) {
                        throw new Error('User Not Found...');
                    }
                    user.createdEvents.push(event);
                    return user.save();
                    
                })
                .then(result=> {
                    return createdEvent;
                })
                .catch(err => {
                    console.log(err)
                    throw err;

                })
            } ,
            createUser: args=> {

             return User.findOne({email:args.userInput.email}).then(user=> {
                 if(user) {
                     throw new Error('User Already Exists...');
                 }
                 return bcrypt
                 .hash(args.userInput.password,12)
            
             })   
                 .then(hashPassword => {

                    const user=new User({
                        email:args.userInput.email,
                        password:hashPassword
                    })
                    return user.save()
                  
                })
                .then(result=> {
                    return {...result._doc,password:null,_id:result.id}
                })
                .catch(err=> {
                    throw err;
                })
            }
        },
        graphiql:true
    })
)

mongoose.connect("mongodb+srv://mongodb:mongodb@52152@node-rest-shop-vq8uf.mongodb.net/event?retryWrites=true",{

               // useMongoClient:true,
                useNewUrlParser: true
})
mongoose.connection.on('error', function(error) {
  console.error('Database connection error:', error);
});
app.listen(3000)
mongoose.connection.once('open', function() {
  console.log('Database connected');
 
});

// .then(
//     console.log('connection successfully...'),
//     
// )
// .catch(err=> {
//     console.log('---------------------------------');
//     console.log(err);
// });
