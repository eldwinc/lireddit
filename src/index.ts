import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";

const main= async ()=>{
    const orm= await MikroORM.init(microConfig);
    const post= orm.em.create(Post,{title:'my 1st post'});
    await orm.em.persistAndFlush(post);
    console.log("-----------------sql2");
    await orm.em.nativeInsert(Post,{title:'my 2nd post'});
};

main().catch(err=>{
    console.error(err);
});