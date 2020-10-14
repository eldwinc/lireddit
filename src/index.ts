import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";


const main= async ()=>{
    const orm= await MikroORM.init(microConfig); //connect to db
    await orm.getMigrator().up(); //autorun migrations, itll do this b4 anything after
    const post= orm.em.create(Post,{title:'my 1st post'});
    await orm.em.persistAndFlush(post);
    // await orm.em.nativeInsert(Post,{title:'my 2nd post'}); //causes an err during migration bc Date() isnt created bc nativeInsert doesnt allow access to the classes
    // const posts= await orm.em.find(Post,{}); //lists all posts. need await or less sys wont wait for promise to come back n will consolelog nothing
    // console.log(posts);
};

main().catch(err=>{
    console.error(err);
});