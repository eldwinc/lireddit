import "reflect-metadata"; //req'd for typegraphql to work
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
import express from 'express';
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
//60.45
const main= async ()=>{
    const orm= await MikroORM.init(microConfig); //connect to db
    await orm.getMigrator().up(); //autorun migrations, itll do this b4 anything after
    
    //graphql server setup w typegraphql schema
    const app= express(); //create instance of express
    const apolloServer= new ApolloServer({ 
        schema: await buildSchema({
            resolvers:[HelloResolver,PostResolver],
            validate:false
        }),
        context:()=>({em: orm.em}) //to query everything from db & return em, u need access to em. context is a special obj accessible by all resolvers
    });
    apolloServer.applyMiddleware({app}); //creates a graphql endpt with express!
    
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