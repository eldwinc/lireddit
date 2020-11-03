//03.11.03
import { User } from "../entities/User";
import { MyContext } from "../types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";

@InputType() //used for inputs
class UsernamePasswordInput{
    @Field()
    username:string
    @Field()
    password:string
}

@ObjectType()
class FieldError{
    @Field()
    field:string
    @Field()
    message:string
}

@ObjectType() //objTypes are used for outputs
class UserResponse{ //fields are OR/"?:" 
    @Field(()=>[FieldError],{nullable:true}) //need to specfy type bc we're setting nullable is true
    errors?:FieldError[]
    @Field(()=>User, {nullable:true})
    user?:User
    
}

@Resolver()
export class UserResolver{
    @Query(()=>[User]) //query all users in db
    users(@Ctx() {em}:MyContext):Promise<User[]>{
        return em.find(User,{})
    }

    @Mutation(()=>UserResponse)
    async register(
        @Arg('options') options:UsernamePasswordInput,
        @Ctx() {req,em}:MyContext
    ): Promise<UserResponse>{
        if(options.username.length <3){ //simple if validation, we can use a validation library too
            return {
                errors:[{
                    field: "username",
                    message:"length must be greater than 2"
                }]
            }
        }
        if(options.password.length<3){
            return{
                errors:[{
                    field:"password",
                    message:"password must be greater than 2 characters"
                }]
            }
        }
        const hashedPassword= await argon2.hash(options.password);
        // const user= em.create(User,{
        //     username:options.username,
        //     password:hashedPassword
        // });
        let user;
        try {
            const result= await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert({
                username:options.username,
                password:hashedPassword,
                created_at: new Date(), //adding these explicitly as we're using Knex, not MicroORM here
                updated_at: new Date() //microORM also adds underscores for us but Knex doesnt so we manually gotta do it
            }) //_ as _ is called casting (set it as). we're using QueryBuilder bc persistNFlush is causing issues
            .returning("*"); //return all fields
            user= result[0];
            // await em.persistAndFlush(user); //breaking so we're using Knex instead (using SQL to create our queries ourselves)
        } catch (error) {
            console.log("Error: ",error);
            if(error.code==="23505"){ 
                return {
                    errors:[{
                        field:"username",
                        message:"username already exists"
                    }]
                }
            }
        }
        console.log("i am user: ",user);
        req.session.userId=user.id; //adding req in Ctx &this line will autolog u in after registering
        return {user}; //if there wasnt a catch, func would try to return a null for this obj. if this obj isnt nullable, then thered be an error saying tried to return non-nullable obj
    }

    @Query(()=>User,{nullable:true})
    async me(@Ctx(){req,em}:MyContext){ //tsc is pwrful bc u can even set a func as sync or async. huge flexibility
        console.log(req.session);
        if(!req.session.userId){
            return null //if ur not logged in, null returned
        }
        const user= await em.findOne(User,{id:req.session.userId});
        return user //otherwise, userId is returned!
    }

    @Mutation(()=>UserResponse)
    async login(
        @Arg('options') options:UsernamePasswordInput,
        @Ctx() {req,em}:MyContext
    ):Promise<UserResponse>{ //login is going to return a UserResponse
        const user= await em.findOne(User,{username:options.username});
        if(!user){
            return {
                errors:[{
                    field:"username",
                    message:"username doesn't exist"
                }]
            }
        }
        const valid= await argon2.verify(user.password,options.password);
        if(!valid){
            return {
                errors:[{
                    field:"password",
                    message:"incorrect password"
                }]
            };
        }

        //store cookie in your session for persisted login. no cookie= no persisted login
        req.session.userId= user.id; //sesion variable can store anything inside, like a userId. !. means u kno forsure its type is defined. ?. means it may OR maynot be
        req.session.randoKey= "u can do anything" //u can generate any key-value u want
        return {user}; //no errors returned here
    }
}