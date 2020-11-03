import "reflect-metadata"; //req'd for typegraphql to work
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
import express from 'express';
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from "cors";

const main= async ()=>{
    const orm= await MikroORM.init(microConfig); //connect to db
    await orm.getMigrator().up(); //autorun migrations, itll do this b4 anything after
    
    const app= express(); //create instance of express
    
    const RedisStore = connectRedis(session); //order u add express middleware is the order theyll run
    const redisClient = redis.createClient() //here session runs b4 apollo as itll be running inside apollo, thus it must go first
    
    //cors
    app.use(
        cors({
            origin:"http://localhost:3000",
            credentials:true
        })
    );

    //sessions
    app.use(
        session({
            name: 'qid', //name of ur cookie
            store: new RedisStore({ //tells session we're using redis
                client: redisClient,
                disableTouch:true //each time user makes action, sys detects & touches session to tellem to keep session alive. disabling means session is alive 4ever
            }),
            cookie: { //f yur cookie dont work, ensure request.credentials is set to include inst of omit in the localhost page settings
                httpOnly:true, //cookie cant be accessed from your frontend javascript code
                maxAge: 1000*60*60*24*365*2, //2y
                sameSite:'lax', //protects csrf token
                secure:__prod__ //cookie can only be used in https, but in dev we're on localhost so we only want this in prod
            },
            saveUninitialized:false,
            secret: 'qweqwe', //what youll sign (encrypt) ur cookie with
            resave: false, //stops sesion from continually pinging redis
        }) //session can be accessed by the resolvers by inputting req & res into ApolloServer's context func
    );

    const apolloServer= new ApolloServer({ //graphql server setup w typegraphql schema
        schema: await buildSchema({
            resolvers:[HelloResolver,PostResolver,UserResolver],
            validate:false,
        }),
        context:({req,res})=> ({em: orm.em,req,res}), //to query everything from db & return em, u need access to em. context is a special obj accessible by all resolvers
    });
    apolloServer.applyMiddleware({app, cors:false}); //creates a graphql endpt with express!
    
    app.listen(4000,()=>{console.log('server started on localhost:4000')}); //start server on port4k
    //Test Express
    // app.get('/',(_,res)=>{  //create path endpt via get, ignore req parameter by inputting an underscore. then sending msg to connected server
    //     res.send('hello')
    // });

    // Create a Post, then execute it
    // const post= orm.em.create(Post,{title:'my 1st post'}); //create action (post)
    // await orm.em.persistAndFlush(post); //execute action (post)
    // await orm.em.nativeInsert(Post,{title:'my 2nd post'}); //causes an err during migration bc Date() isnt created bc nativeInsert doesnt allow access to the classes
    
    //List all posts
    // const posts= await orm.em.find(Post,{}); //lists all posts. need await or less sys wont wait for promise to come back n will consolelog nothing
    // console.log(posts);
};

main().catch(err=>{
    console.error(err);
});