import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request,Response } from "express";

export type MyContext= {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    req: Request & {session: Express.Session}; //&... makes request's variable explicitly defined instead of ?: undefined
    res: Response;
};