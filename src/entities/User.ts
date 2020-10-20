import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(()=>String) 
  @Property({type:"date"})
  createdAt = new Date();

  @Field(()=>String) //of type string. needs explicit declaration as its date (sys cant infer it)
  @Property({type:"date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field() //it can infer string type from this
  @Property({type:"text",unique:true})
  username!: string;

  //this doesnt have @Field decorator bc we dont want users to be able to select this. its no longer a col
  @Property({type:"text"})
  password!: string;
}