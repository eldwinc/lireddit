import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Post {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(()=>String) 
  @Property({type:"date"})
  createdAt = new Date();

  @Field(()=>String) //of type string. needs explicit declaration as its date
  @Property({type:"date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field() //it can infer string type from this
  @Property({type:"text"})
  title!: string;
}