import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver{
    //multi-read
    @Query(()=>[Post]) //set graphql type to array of post(?)
    posts(@Ctx() {em}:MyContext): Promise<Post[]> { //set tsc type to em
        return em.find(Post,{});
    }

    //single read
    @Query(()=>Post,{nullable:true}) 
    post(
        @Arg('id',()=>Int) id: number, //argument is what parameter u want to search with
        @Ctx() {em}:MyContext
    ): Promise<Post|null> { //or null if no matching entry is found
        return em.findOne(Post,{id});
    }

    //create/insert
    @Mutation(()=>Post)
    async createPost(
        @Arg('title') title:String,
        @Ctx() {em}:MyContext
    ):Promise<Post>{
        const post= em.create(Post,{title});
        await em.persistAndFlush(post);
        return post;
    }

    //update
    @Mutation(()=>Post, {nullable:true})
    async updatePost(
        @Arg('id') id:number,
        @Arg('title',()=>String,{nullable:true}) title:string,
        @Ctx() {em}:MyContext
    ):Promise<Post|null>{
        const post= await em.findOne(Post,{id});
        if(!post){return null}
        if(typeof title !=='undefined'){
            post.title=title;
            await em.persistAndFlush(post);
        }
        return post;
    }

    //delete
    @Mutation(()=>Boolean)
    async deletePost(
        @Arg('id') id:number,
        @Ctx() {em}:MyContext
    ):Promise<Boolean>{
        await em.nativeDelete(Post,{id}); //dont need to access its fields so just nativeDelete
        return true;
    }
}